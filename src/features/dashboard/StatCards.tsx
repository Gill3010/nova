import React from 'react';
import { Card } from '../../components/common/Card';

interface StatCardsProps {
  totalCongresos: number;
  totalEnvios: number;
}

export const StatCards: React.FC<StatCardsProps> = React.memo(({ totalCongresos, totalEnvios }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="flex flex-col justify-center items-center p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Total Congresos
        </h3>
        <p className="text-4xl font-bold text-slate-900 dark:text-white">
          {totalCongresos}
        </p>
      </Card>
      
      <Card className="flex flex-col justify-center items-center p-6 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/35">
        <h3 className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1">
          Artículos Recibidos
        </h3>
        <p className="text-4xl font-bold text-indigo-900 dark:text-indigo-300">
          {totalEnvios}
        </p>
      </Card>
    </div>
  );
});

StatCards.displayName = 'StatCards';
