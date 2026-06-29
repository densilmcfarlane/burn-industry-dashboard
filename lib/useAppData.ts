'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const DEBT_DEFAULTS = [
  { debt_id:'td',       name:'TD First Class ···6932',  bal:21854, rate:11.00, min_payment:228, due_day:6,  autopay:false, sort_order:1 },
  { debt_id:'amex',     name:'Amex Cobalt ···1700',     bal:4296,  rate:21.99, min_payment:89,  due_day:18, autopay:false, sort_order:2 },
  { debt_id:'scotia',   name:'Scotiabank Visa ···3026', bal:2906,  rate:13.99, min_payment:42,  due_day:6,  autopay:false, sort_order:3 },
  { debt_id:'tang_loc', name:'Tangerine LOC ···6380',   bal:2713,  rate:9.45,  min_payment:76,  due_day:21, autopay:true,  sort_order:4 },
  { debt_id:'tang_mc',  name:'Tangerine MC ···6704',    bal:2501,  rate:20.95, min_payment:52,  due_day:24, autopay:false, sort_order:5 },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function useAppData() {
  const [userId, setUserId]         = useState<string|null>(null);
  const [loaded, setLoaded]         = useState(false);
  const [prefs, setPrefs]           = useState({ sound:true, music:false, band_emails:'denz@burnindustry.com, simonouthit@gmail.com' });
  const [streak, setStreak]         = useState({ count:0, last_day:null as string|null });
  const [tasks, setTasks]           = useState<any[]>([]);
  const [dailyState, setDailyState] = useState<any>({ morning_done:{}, night_done:{}, battle_slots:[null,null,null], battle_done:{}, unplanned:[], ko_shown:false });
  const [journal, setJournal]       = useState<Record<string,any>>({});
  const [debts, setDebts]           = useState<any[]>(DEBT_DEFAULTS);
  const [incomeLog, setIncomeLog]   = useState<any[]>([]);
  const [spendingLog, setSpendingLog] = useState<any[]>([]);
  const [advanceData, setAdvanceData] = useState<Record<string,any>>({});
  const [pnl, setPnlData]           = useState<Record<string,any>>({});

  const today = todayStr();
  const supabase = createClient();

  // Load everything on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [
        { data: prefData },
        { data: streakData },
        { data: tasksData },
        { data: dailyData },
        { data: journalData },
        { data: debtsData },
        { data: incomeData },
        { data: spendData },
        { data: advData },
        { data: pnlData },
      ] = await Promise.all([
        supabase.from('preferences').select('*').eq('user_id', user.id).single(),
        supabase.from('streak').select('*').eq('user_id', user.id).single(),
        supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('daily_state').select('*').eq('user_id', user.id).eq('date', today).single(),
        supabase.from('journal').select('*').eq('user_id', user.id).order('date', { ascending:false }),
        supabase.from('debts').select('*').eq('user_id', user.id).order('sort_order'),
        supabase.from('income_log').select('*').eq('user_id', user.id).order('created_at', { ascending:false }),
        supabase.from('spending_log').select('*').eq('user_id', user.id).order('created_at', { ascending:false }),
        supabase.from('advance_data').select('*').eq('user_id', user.id),
        supabase.from('pnl').select('*').eq('user_id', user.id),
      ]);

      if (prefData) setPrefs(prefData);
      if (streakData) setStreak(streakData);
      if (tasksData) setTasks(tasksData);
      if (dailyData) setDailyState(dailyData);
      if (journalData) {
        const j: Record<string,any> = {};
        journalData.forEach((r:any) => { j[r.date] = r; });
        setJournal(j);
      }
      if (debtsData && debtsData.length > 0) setDebts(debtsData);
      else {
        // Seed debts for new user
        const seedDebts = DEBT_DEFAULTS.map(d => ({ ...d, user_id: user.id }));
        const { data: inserted } = await supabase.from('debts').insert(seedDebts).select();
        if (inserted) setDebts(inserted);
      }
      if (incomeData) setIncomeLog(incomeData);
      if (spendData) setSpendingLog(spendData);
      if (advData) {
        const a: Record<string,any> = {};
        advData.forEach((r:any) => { a[r.show_date] = r.data; });
        setAdvanceData(a);
      }
      if (pnlData) {
        const p: Record<string,any> = {};
        pnlData.forEach((r:any) => { p[r.show_date] = { income: r.income, expenses: r.expenses }; });
        setPnlData(p);
      }
      setLoaded(true);
    }
    load();
  }, []);

  // PREFS
  const savePrefs = useCallback(async (update: Partial<typeof prefs>) => {
    if (!userId) return;
    const next = { ...prefs, ...update };
    setPrefs(next);
    await supabase.from('preferences').upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() });
  }, [userId, prefs]);

  // STREAK
  const saveStreak = useCallback(async (count: number, last_day: string) => {
    if (!userId) return;
    setStreak({ count, last_day });
    await supabase.from('streak').upsert({ user_id: userId, count, last_day });
  }, [userId]);

  // TASKS
  const addTask = useCallback(async (text: string, energy: number, priority: number) => {
    if (!userId) return;
    const { data } = await supabase.from('tasks').insert({ user_id: userId, text, energy, priority }).select().single();
    if (data) setTasks(t => [...t, data]);
  }, [userId]);

  const removeTask = useCallback(async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(t => t.filter(x => x.id !== id));
  }, []);

  const updateTask = useCallback(async (id: string, update: any) => {
    await supabase.from('tasks').update(update).eq('id', id);
    setTasks(t => t.map(x => x.id === id ? { ...x, ...update } : x));
  }, []);

  // DAILY STATE
  const saveDailyState = useCallback(async (update: any) => {
    if (!userId) return;
    const next = { ...dailyState, ...update };
    setDailyState(next);
    await supabase.from('daily_state').upsert({
      user_id: userId, date: today,
      morning_done: next.morning_done,
      night_done: next.night_done,
      battle_slots: next.battle_slots,
      battle_done: next.battle_done,
      unplanned: next.unplanned,
      ko_shown: next.ko_shown,
      updated_at: new Date().toISOString(),
    });
  }, [userId, dailyState, today]);

  // JOURNAL
  const saveJournal = useCallback(async (date: string, field: string, value: string) => {
    if (!userId) return;
    const existing = journal[date] || {};
    const next = { ...existing, [field]: value };
    setJournal(j => ({ ...j, [date]: next }));
    await supabase.from('journal').upsert({
      user_id: userId, date,
      honest: next.honest || null,
      good: next.good || null,
      night: next.night || null,
      updated_at: new Date().toISOString(),
    });
  }, [userId, journal]);

  // DEBTS
  const updateDebt = useCallback(async (debt_id: string, bal: number) => {
    if (!userId) return;
    setDebts(d => d.map(x => x.debt_id === debt_id ? { ...x, bal } : x));
    await supabase.from('debts').update({ bal }).eq('user_id', userId).eq('debt_id', debt_id);
  }, [userId]);

  // INCOME LOG
  const addIncome = useCallback(async (entry: any) => {
    if (!userId) return;
    const { data } = await supabase.from('income_log').insert({ user_id: userId, ...entry }).select().single();
    if (data) setIncomeLog(l => [data, ...l]);
  }, [userId]);

  const deleteIncome = useCallback(async (id: string) => {
    await supabase.from('income_log').delete().eq('id', id);
    setIncomeLog(l => l.filter(x => x.id !== id));
  }, []);

  // SPENDING LOG
  const addSpend = useCallback(async (period: string, amt: number, note: string) => {
    if (!userId) return;
    const { data } = await supabase.from('spending_log').insert({ user_id: userId, period, amt, note }).select().single();
    if (data) setSpendingLog(l => [data, ...l]);
  }, [userId]);

  const deleteSpend = useCallback(async (id: string) => {
    await supabase.from('spending_log').delete().eq('id', id);
    setSpendingLog(l => l.filter(x => x.id !== id));
  }, []);

  // ADVANCE DATA
  const saveAdvance = useCallback(async (show_date: string, data: any) => {
    if (!userId) return;
    setAdvanceData(a => ({ ...a, [show_date]: data }));
    await supabase.from('advance_data').upsert({ user_id: userId, show_date, data, updated_at: new Date().toISOString() });
  }, [userId]);

  // PNL
  const savePnl = useCallback(async (show_date: string, income: any[], expenses: any[]) => {
    if (!userId) return;
    setPnlData(p => ({ ...p, [show_date]: { income, expenses } }));
    await supabase.from('pnl').upsert({ user_id: userId, show_date, income, expenses, updated_at: new Date().toISOString() });
  }, [userId]);

  return {
    userId, loaded, today,
    prefs, savePrefs,
    streak, saveStreak,
    tasks, addTask, removeTask, updateTask,
    dailyState, saveDailyState,
    journal, saveJournal,
    debts, updateDebt,
    incomeLog, addIncome, deleteIncome,
    spendingLog, addSpend, deleteSpend,
    advanceData, saveAdvance,
    pnl, savePnl,
  };
}
