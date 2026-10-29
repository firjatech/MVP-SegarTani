import { redirect } from 'next/navigation';

export default function AdminSaldoRedirectPage() {
  redirect('/admin/wallet');
}

