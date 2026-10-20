import { redirect } from 'next/navigation';

export default async function ScreenRedirectPage({
  params,
}: {
  params: Promise<{ screenId: string }>;
}) {
  const { screenId } = await params;
  redirect(`/stitch/projects/5230722148065772942/screens/${screenId}`);
}
