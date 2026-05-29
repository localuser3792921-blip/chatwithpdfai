import SiteShell from '../_components/Chrome';
import { CompareTable } from '../_components/landing/audiences';
import { Pricing, FAQ } from '../_components/landing/closing';

export const metadata = { title: 'Pricing — CHATWITHPDFAI' };

export default function PricingPage() {
  return (
    <SiteShell active="pricing">
      <Pricing />
      <CompareTable />
      <FAQ />
    </SiteShell>
  );
}
