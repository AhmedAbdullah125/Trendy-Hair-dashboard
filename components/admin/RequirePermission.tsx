import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { hasAnyPermission, type PermissionName } from '../../lib/permissions';

interface Props {
  /** Any one of these is enough. Empty means "no permission required". */
  anyOf: (PermissionName | string)[];
  children: React.ReactNode;
}

/**
 * Route-level permission gate.
 *
 * Renders an explicit forbidden state rather than redirecting, so an admin who
 * lands on a restricted URL directly is told what happened instead of being
 * bounced somewhere else with no explanation.
 *
 * The API remains the enforcement point; this only avoids offering an action
 * that can only end in a 403.
 */
const RequirePermission: React.FC<Props> = ({ anyOf, children }) => {
  if (hasAnyPermission(anyOf)) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center font-alexandria">
      <div className="w-20 h-20 rounded-full bg-red-50 text-red-400 flex items-center justify-center mb-6">
        <ShieldAlert size={40} />
      </div>
      <h2 className="text-xl font-bold text-app-text mb-2">لا تملك صلاحية الوصول</h2>
      <p className="text-app-textSec text-sm mb-8 max-w-sm leading-relaxed">
        هذه الصفحة تتطلب صلاحية غير متاحة لحسابك. تواصل مع مدير النظام إذا كنت تحتاج إليها.
      </p>
      <Link
        to="/admin/orders"
        className="bg-app-gold text-white font-bold px-6 py-3 rounded-2xl active:scale-95 transition-transform"
      >
        العودة إلى الطلبات
      </Link>
    </div>
  );
};

export default RequirePermission;
