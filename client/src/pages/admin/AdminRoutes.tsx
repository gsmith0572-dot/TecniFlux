import { Switch, Route } from 'wouter';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminDiagrams from './AdminDiagrams';
import AdminFinance from './AdminFinance';
import AdminSettings from './AdminSettings';
import NotFound from '@/pages/not-found';

export default function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/diagrams" component={AdminDiagrams} />
        <Route path="/admin/finance" component={AdminFinance} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}
