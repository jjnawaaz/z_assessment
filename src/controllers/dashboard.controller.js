import FinancialRecord from '../models/FinancialRecord.js';
import sendResponse from '../utils/ApiResponse.js';

/**
 * Build a date filter from query params.
 */
const buildDateFilter = (startDate, endDate) => {
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  return Object.keys(dateFilter).length > 0 ? dateFilter : null;
};

/**
 * GET /api/dashboard/summary
 * Returns total income, total expenses, and net balance.
 * Optional query: startDate, endDate
 */
export const getSummary = async (req, res, next) => {
  try {
    const matchStage = { isDeleted: false };

    const dateFilter = buildDateFilter(req.query.startDate, req.query.endDate);
    if (dateFilter) matchStage.date = dateFilter;

    const result = await FinancialRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Parse aggregation result
    const incomeData = result.find((r) => r._id === 'income') || {
      total: 0,
      count: 0,
    };
    const expenseData = result.find((r) => r._id === 'expense') || {
      total: 0,
      count: 0,
    };

    const summary = {
      totalIncome: incomeData.total,
      totalExpenses: expenseData.total,
      netBalance: incomeData.total - expenseData.total,
      totalRecords: incomeData.count + expenseData.count,
      incomeCount: incomeData.count,
      expenseCount: expenseData.count,
    };

    sendResponse(res, 200, 'Dashboard summary retrieved', summary);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/category-summary
 * Returns income/expense totals grouped by category.
 * Optional query: startDate, endDate, type
 */
export const getCategorySummary = async (req, res, next) => {
  try {
    const matchStage = { isDeleted: false };

    const dateFilter = buildDateFilter(req.query.startDate, req.query.endDate);
    if (dateFilter) matchStage.date = dateFilter;
    if (req.query.type) matchStage.type = req.query.type;

    const result = await FinancialRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          type: '$_id.type',
          total: 1,
          count: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    sendResponse(res, 200, 'Category summary retrieved', {
      categories: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/trends
 * Returns monthly income/expense trends.
 * Optional query: months (default 12)
 */
export const getTrends = async (req, res, next) => {
  try {
    const months = Math.min(24, Math.max(1, parseInt(req.query.months) || 12));

    // Calculate start date for lookback
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const result = await FinancialRecord.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          type: '$_id.type',
          total: 1,
          count: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    // Restructure into monthly summaries
    const trendsMap = {};
    result.forEach((item) => {
      const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
      if (!trendsMap[key]) {
        trendsMap[key] = {
          year: item.year,
          month: item.month,
          period: key,
          income: 0,
          expense: 0,
          incomeCount: 0,
          expenseCount: 0,
        };
      }
      if (item.type === 'income') {
        trendsMap[key].income = item.total;
        trendsMap[key].incomeCount = item.count;
      } else {
        trendsMap[key].expense = item.total;
        trendsMap[key].expenseCount = item.count;
      }
    });

    // Convert to sorted array and add net balance
    const trends = Object.values(trendsMap)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((t) => ({
        ...t,
        netBalance: t.income - t.expense,
      }));

    sendResponse(res, 200, 'Monthly trends retrieved', { trends, months });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/recent
 * Returns the last N transactions (default 10).
 * Optional query: limit (default 10, max 50)
 */
export const getRecentActivity = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const records = await FinancialRecord.find({ isDeleted: false })
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .limit(limit);

    sendResponse(res, 200, 'Recent activity retrieved', { records });
  } catch (error) {
    next(error);
  }
};
