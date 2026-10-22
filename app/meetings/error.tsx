"use client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="grid min-h-[60vh] place-items-center text-center"><div><AlertCircle className="mx-auto text-[#b45b43]"/><h1 className="mt-4 text-xl font-semibold">We couldn’t load your meetings</h1><p className="mt-2 text-sm text-[#718078]">The workspace is safe. Try loading this view again.</p><Button className="mt-5" onClick={reset}>Try again</Button></div></div>; }
