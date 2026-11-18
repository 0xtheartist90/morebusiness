import { Dashboard } from '@/components/dashboard/dashboard';
import { loadKoersen } from '@/lib/koersen';
import { loadZaken } from '@/lib/zaken';

// The data comes live from the Google Sheet; the page is rebuilt at most every 5 minutes (same as the sheet fetch).
export const revalidate = 300;

const Page = async () => {
    const [data, koersen] = await Promise.all([loadZaken(), loadKoersen()]);

    return <Dashboard data={data} koersen={koersen} />;
};

export default Page;
