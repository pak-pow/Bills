import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Horizon } from '@stellar/stellar-sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;
const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const server = new Horizon.Server(HORIZON_URL);

// In-memory store for bills (since it's a prototype)
let bills = [
  {
    id: 1,
    description: 'Meralco Electricity',
    totalAmount: 150, // USDC
    dueDate: '2026-06-15',
    status: 'Pending',
    shares: [
      { name: 'Alice (50%)', amount: 75, status: 'Paid' },
      { name: 'Bob (30%)', amount: 45, status: 'Unpaid' },
      { name: 'Charlie (20%)', amount: 30, status: 'Unpaid' }
    ]
  },
  {
    id: 2,
    description: 'Maynilad Water',
    totalAmount: 50, // USDC
    dueDate: '2026-06-20',
    status: 'Pending',
    shares: [
      { name: 'Alice (50%)', amount: 25, status: 'Unpaid' },
      { name: 'Bob (30%)', amount: 15, status: 'Unpaid' },
      { name: 'Charlie (20%)', amount: 10, status: 'Unpaid' }
    ]
  },
  {
    id: 3,
    description: 'PLDT Internet',
    totalAmount: 60, // USDC
    dueDate: '2026-06-01',
    status: 'Paid',
    shares: [
      { name: 'Alice (50%)', amount: 30, status: 'Paid' },
      { name: 'Bob (30%)', amount: 18, status: 'Paid' },
      { name: 'Charlie (20%)', amount: 12, status: 'Paid' }
    ]
  }
];

// Default mock roommate profiles for demo
const DEFAULT_ROOMMATES = [
  {
    name: 'Alice',
    address: 'GD6W2XJ... (Roommate A)',
    shareBps: 5000,
    sharePercent: 50,
    role: 'Admin / House Manager'
  },
  {
    name: 'Bob',
    address: 'GB7Y3YK... (Roommate B)',
    shareBps: 3000,
    sharePercent: 30,
    role: 'Roommate'
  },
  {
    name: 'Charlie',
    address: 'GC8Z4ZL... (Roommate C)',
    shareBps: 2000,
    sharePercent: 20,
    role: 'Roommate'
  }
];

let roommates = [...DEFAULT_ROOMMATES];

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', network: 'testnet', service: 'Palo! Bills' });
});

// Load Stellar balances
app.get('/api/account/:address', async (req, res) => {
  const { address } = req.params;
  try {
    const account = await server.loadAccount(address);
    const balances = account.balances.map((b) => ({
      asset: b.asset_type === 'native' ? 'XLM' : b.asset_code,
      issuer: b.asset_type === 'native' ? null : b.asset_issuer,
      balance: b.balance,
    }));
    res.json({ address, balances });
  } catch (err) {
    res.status(404).json({ error: 'Account not found on Stellar Testnet. Fund via Friendbot!' });
  }
});

// GET all bills
app.get('/api/bills', (_req, res) => {
  res.json(bills);
});

// POST a new bill - dynamically calculates splits based on the current roommate directory
app.post('/api/bills', (req, res) => {
  const { description, totalAmount, dueDate } = req.body;
  if (!description || !totalAmount || !dueDate) {
    return res.status(400).json({ error: 'Missing required bill fields.' });
  }

  const newBill = {
    id: bills.length + 1,
    description,
    totalAmount: parseFloat(totalAmount),
    dueDate,
    status: 'Pending',
    shares: roommates.map(r => ({
      name: `${r.name} (${r.sharePercent}%)`,
      amount: parseFloat((totalAmount * (r.sharePercent / 100)).toFixed(2)),
      status: 'Unpaid'
    }))
  };

  bills.unshift(newBill); // Add to the front
  res.status(201).json(newBill);
});

// POST update roommates list
app.post('/api/roommates', (req, res) => {
  const { newRoommates } = req.body;
  if (!Array.isArray(newRoommates)) {
    return res.status(400).json({ error: 'Invalid roommates list structure.' });
  }
  
  roommates = newRoommates.map(r => ({
    name: r.name,
    address: r.address,
    shareBps: parseInt(r.sharePercent) * 100,
    sharePercent: parseInt(r.sharePercent),
    role: r.role || 'Roommate'
  }));

  res.json({ success: true, roommates });
});

// POST reset roommate directory and bills to defaults
app.post('/api/roommates/reset', (_req, res) => {
  roommates = [...DEFAULT_ROOMMATES];
  bills = [
    {
      id: 1,
      description: 'Meralco Electricity',
      totalAmount: 150,
      dueDate: '2026-06-15',
      status: 'Pending',
      shares: [
        { name: 'Alice (50%)', amount: 75, status: 'Paid' },
        { name: 'Bob (30%)', amount: 45, status: 'Unpaid' },
        { name: 'Charlie (20%)', amount: 30, status: 'Unpaid' }
      ]
    },
    {
      id: 2,
      description: 'Maynilad Water',
      totalAmount: 50,
      dueDate: '2026-06-20',
      status: 'Pending',
      shares: [
        { name: 'Alice (50%)', amount: 25, status: 'Unpaid' },
        { name: 'Bob (30%)', amount: 15, status: 'Unpaid' },
        { name: 'Charlie (20%)', amount: 10, status: 'Unpaid' }
      ]
    }
  ];
  res.json({ success: true, roommates, bills });
});

// PUT update roommate bill payment status
app.put('/api/bills/:id/pay', (req, res) => {
  const { id } = req.params;
  const { roommateName } = req.body;

  const bill = bills.find(b => b.id === parseInt(id));
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found.' });
  }

  const share = bill.shares.find(s => s.name.startsWith(roommateName));
  if (!share) {
    return res.status(404).json({ error: 'Roommate share not found.' });
  }

  share.status = 'Paid';

  // If all roommates paid, mark bill as Paid
  const allPaid = bill.shares.every(s => s.status === 'Paid');
  if (allPaid) {
    bill.status = 'Paid';
  }

  res.json(bill);
});

// GET roommate directory
app.get('/api/roommates', (_req, res) => {
  res.json(roommates);
});

app.listen(PORT, () => {
  console.log(`\n🚀 Palo! Bills Backend running on http://localhost:${PORT}`);
  console.log(`   Network: Stellar Testnet`);
  console.log(`   Horizon: ${HORIZON_URL}\n`);
});
