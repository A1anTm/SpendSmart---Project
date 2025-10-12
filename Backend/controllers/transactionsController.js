import Transaction from "../models/transactionsModel.js";
import Category from "../models/categoryModel.js";
import mongoose from "mongoose";

export const createTransaction = async (req, res) => {
  try {
    const { type, amount, date, category_id, description } = req.body;

    if (!['ingreso', 'gasto'].includes(type))
      return res.status(400).json({ message: 'Tipo debe ser ingreso o gasto' });

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0)
      return res.status(400).json({ message: 'Monto inválido' });

    if (category_id) {
      const cat = await Category.findById(category_id);
      if (!cat)
        return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    console.log('🔍 Usuario en createTransaction:', req.user);
    console.log('🔍 ID que uso en match:', req.user._id);

    if (type === 'gasto') {
      const [totalIncome, totalExpense] = await Promise.all([
        Transaction.aggregate([
          { $match: {  user_id: new mongoose.Types.ObjectId(req.user._id),  type: 'ingreso' } },
          { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
        ]),
        Transaction.aggregate([
          { $match: { user_id: new mongoose.Types.ObjectId(req.user._id),  type: 'gasto' } },
          { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
        ])
      ]);

      const income  = totalIncome[0]?.total || 0;
      const expense = totalExpense[0]?.total || 0;
      const balance = income - expense;

      console.log('🔍 SALDO EN CREATE TX:', { income, expense, balance, amount: numAmount });

      const totalBalance =
        (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0);

      if (numAmount > totalBalance)
        return res.status(400).json({ message: 'Saldo insuficiente' });
    }

    const newTx = await Transaction.create({
    user_id: req.user._id,
    type,
    amount,
    date: date ? new Date(date) : new Date(), 
    category_id,
    description: description || null
  });

    return res.status(201).json({ message: 'Transacción creada exitosamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al crear transacción' });
  }
};


export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    const currentTx = await Transaction.findOne({ _id: id, user_id: userId });
    if (!currentTx)
      return res.status(404).json({ message: 'Transacción no encontrada' });

    if (updates.category_id) {
      const cat = await Category.findById(updates.category_id);
      if (!cat)
        return res.status(404).json({ message: 'Categoría no encontrada' });

      const finalType = updates.type || currentTx.type;

      if (![finalType].includes(cat.appliesTo))
        return res.status(400).json({
          message: `La categoría "${cat.name}" no está permitida para ${finalType}s`
        });
    }

    const updatedTx = await Transaction.findOneAndUpdate(
      { _id: id, user_id: userId },
      updates,
      { new: true, runValidators: true }
    ).populate('category_id', 'name');

    return res.status(201).json({ message: 'Acutalización realizada exitosamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al actualizar transacción' });
  }
};


export const deleteTransaction = async (req, res) => {
try {
    const { id } = req.params;
    const tx = await Transaction.findOneAndDelete({
    _id: id,
    user_id: req.user._id,
    });
    if (!tx)
    return res.status(404).json({ message: "Transacción no encontrada" });
    return res.json({ message: "Transacción eliminada" });
} catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error al eliminar transacción" });
}
};


export const getTransactionsByFilter = async (req, res) => {
  try {
    const { type, categoryName, startDate, endDate, page = 1, limit = 20 } = req.body;
    const userId = req.user._id;
    const skip = (page - 1) * limit;

    const match = { user_id: new mongoose.Types.ObjectId(userId) };
    if (type) match.type = type;
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'cat'
        }
      },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },

      ...(categoryName ? [{
        $match: { 'cat.name': { $regex: categoryName, $options: 'i' } }
      }] : []),

      { $sort: { date: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 1,
          type: 1,
          amount: { $toDouble: '$amount' },
          date: 1,
          description: 1,
          category: { $ifNull: ['$cat.name', 'Sin categoría'] },
          category_id: 1,
          createdAt: 1
        }
      }
    ];

    const countPipeline = [
      ...pipeline.slice(0, -3), 
      { $count: 'total' }
    ];

    const [data, totalResult] = await Promise.all([
      Transaction.aggregate(pipeline),
      Transaction.aggregate(countPipeline)
    ]);

    return res.json({
      total: totalResult[0]?.total || 0,
      page: Number(page),
      limit: Number(limit),
      transactions: data
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Error al obtener transacciones' });
  }
};

