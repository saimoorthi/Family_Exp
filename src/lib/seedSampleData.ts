import { db } from './firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { Expense, Deposit } from '../types';

export async function checkAndSeedInitialData(userId: string, userName: string) {
  try {
    const expSnap = await getDocs(collection(db, 'expenses'));
    if (!expSnap.empty) return; // already has data

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

    // Seed sample deposit
    const sampleDeposit: Deposit = {
      id: 'dep_sample_salary',
      title: 'Monthly Salary Contribution',
      amount: 32500,
      depositedBy: userId,
      depositedByName: userName || 'Admin',
      date: threeDaysAgo,
      paymentMethod: 'Bank Transfer',
      description: 'Monthly common family pool contribution',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'deposits', sampleDeposit.id), sampleDeposit);

    // Seed sample expenses matching the mockup
    const sampleExpenses: Expense[] = [
      {
        id: 'exp_sample_groceries',
        title: 'Groceries & Provisions',
        amount: 1250,
        category: 'Groceries',
        date: today,
        paidBy: userId,
        paidByName: userName || 'Admin',
        paymentMethod: 'UPI',
        description: 'Vegetables, milk, fruits, and weekly supermarket supplies',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp_sample_electricity',
        title: 'Electricity Bill',
        amount: 2480,
        category: 'Electricity',
        date: yesterday,
        paidBy: userId,
        paidByName: userName || 'Admin',
        paymentMethod: 'Bank Transfer',
        description: 'Monthly home electric board invoice',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp_sample_rent',
        title: 'House Maintenance & Utilities',
        amount: 15000,
        category: 'Rent / House Maintenance',
        date: threeDaysAgo,
        paidBy: userId,
        paidByName: userName || 'Admin',
        paymentMethod: 'Bank Transfer',
        description: 'Building maintenance & society fund',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp_sample_medical',
        title: 'Pharmacy & Health Checkup',
        amount: 3400,
        category: 'Medical',
        date: yesterday,
        paidBy: userId,
        paidByName: userName || 'Admin',
        paymentMethod: 'Card',
        description: 'Monthly prescription medicines for parents',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp_sample_transport',
        title: 'Vehicle Fuel & Metro Pass',
        amount: 4500,
        category: 'Transportation',
        date: threeDaysAgo,
        paidBy: userId,
        paidByName: userName || 'Admin',
        paymentMethod: 'UPI',
        description: 'Petrol and metro smart cards recharge',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp_sample_other',
        title: 'Home Internet & Streaming',
        amount: 1800,
        category: 'Other',
        date: threeDaysAgo,
        paidBy: userId,
        paidByName: userName || 'Admin',
        paymentMethod: 'UPI',
        description: 'High-speed fiber connection',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const exp of sampleExpenses) {
      await setDoc(doc(db, 'expenses', exp.id), exp);
    }
  } catch (err) {
    console.warn('Initial sample seeding skipped:', err);
  }
}
