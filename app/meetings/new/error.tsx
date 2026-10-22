"use client";
export default function Error({ reset }: { reset: () => void }) { return <div role="alert" className="rounded-2xl border bg-white p-8"><h1 className="text-xl font-semibold">Meeting setup could not load</h1><button className="mt-4 text-sm font-semibold text-moss-700" onClick={reset}>Try again</button></div>; }
