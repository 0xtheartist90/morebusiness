import { Dashboard } from '@/components/dashboard/dashboard';
import { loadZaken } from '@/lib/zaken';

// The data comes live from the Google Sheet; the page is rebuilt at most every 5 minutes (same as the sheet fetch).
export const revalidate = 300;

const Page = async () => {
    const data = await loadZaken();

    return <Dashboard data={data} />;
};

export default Page;
