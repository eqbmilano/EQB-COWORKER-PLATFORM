import { endOfMonth, format, startOfMonth } from "date-fns";
import BacklogDashboard from "@/components/backlog/BacklogDashboard";
import BacklogEntriesList from "@/components/backlog/BacklogEntriesList";
import MonthlyRecapList from "@/components/backlog/MonthlyRecapList";

export default function BacklogPage() {
  const startDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const endDate = format(endOfMonth(new Date()), "yyyy-MM-dd");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Backlog Ore Lavorate</h1>
        <p className="mt-2 text-gray-600">
          Monitoraggio automatico delle ore lavorate e capacità mensile
        </p>
      </div>

      <div className="space-y-6">
        {/* Dashboard with Statistics */}
        <BacklogDashboard />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Entries List */}
          <div className="lg:col-span-2">
            <BacklogEntriesList startDate={startDate} endDate={endDate} />
          </div>

          {/* Monthly Recaps */}
          <div>
            <MonthlyRecapList />
          </div>
        </div>
      </div>
    </div>
  );
}
