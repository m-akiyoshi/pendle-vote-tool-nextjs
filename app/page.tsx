import { Card, CardContent } from "@/components/ui";
import { ArrowRight, Search, Clock, Bell } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <main className="max-w-3xl mx-auto px-6 py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold text-neutral-100 mb-4">
            Pendle Vote Tools
          </h1>
          <p className="text-lg text-neutral-400 max-w-md mx-auto">
            View and manage Pendle vote transactions with ease.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid gap-4">
          <Link href="/get-vote" className="group">
            <Card className="hover:border-neutral-700 transition-colors">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-neutral-800 text-neutral-300">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-neutral-100 mb-1">
                        Vote Transaction Lookup
                      </h2>
                      <p className="text-sm text-neutral-500">
                        View vote details from a transaction hash
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/latest-vote" className="group">
            <Card className="hover:border-neutral-700 transition-colors">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-neutral-800 text-neutral-300">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-neutral-100 mb-1">
                        Latest Vote Lookup
                      </h2>
                      <p className="text-sm text-neutral-500">
                        Find the latest vote from any wallet address
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/manage-addresses" className="group">
            <Card className="hover:border-neutral-700 transition-colors">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-neutral-800 text-neutral-300">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-neutral-100 mb-1">
                        Vote Notifications
                      </h2>
                      <p className="text-sm text-neutral-500">
                        Manage watched addresses for email alerts
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
