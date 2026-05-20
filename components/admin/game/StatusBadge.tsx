import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const StatusBadge = ({ status }: { status: 'active' | 'inactive' }) => {
    return status === 'active' ? (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 flex items-center gap-1 w-fit">
            <CheckCircle2 size={14} /> نشط
        </span>
    ) : (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 flex items-center gap-1 w-fit">
            <AlertCircle size={14} /> غير نشط
        </span>
    );
};
