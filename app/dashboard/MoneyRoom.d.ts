export default function MoneyRoom(props: {
  debts: any[];
  incomeLog: any[];
  spendingLog: any[];
  updateDebt: (debt_id: string, bal: number) => Promise<void>;
  addIncome: (entry: any) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addSpend: (period: string, amt: number, note: string) => Promise<void>;
  deleteSpend: (id: string) => Promise<void>;
}): JSX.Element;
