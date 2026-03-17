import { useState } from "react";
import {
  Search,
  Loader2,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  User,
  BookOpen,
  GraduationCap,
  Award,
  Hash,
  Clock,
  Code,
  Target,
  Terminal,
} from "lucide-react";

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    // Validate URL
    if (!url.includes("skillrack.com") || !url.includes("profile")) {
      setError("Please enter a valid SkillRack profile URL.");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      // Use the injected Vercel API URL if available, else fallback to relative/local route
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/fetch-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));

        if (errData.code === "UPSTREAM_BLOCKED") {
          throw new Error(
            errData.error ||
              "Skillrack blocked automated access for this IP/session. This can last longer than 1-2 minutes. Try again later or from a different network.",
          );
        }

        if (errData.code === "SCRAPER_TIMEOUT") {
          throw new Error(
            "Skillrack is responding slowly. Please retry in a moment.",
          );
        }

        throw new Error(errData.error || "Failed to fetch data");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setData(null);
    setUrl("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[100px] opacity-60"></div>
      </div>

      <div className="flex-grow z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-white rounded-lg shadow-md shadow-blue-200">
              <Code className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Skillrack{" "}
              <span className="text-primary font-mono bg-blue-50 px-2 py-0.5 rounded ml-1">
                Tracker
              </span>
            </h1>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col">
          {/* Default Start View */}
          {!data && !loading && (
            <div className="my-auto max-w-3xl mx-auto text-center space-y-8 pb-20">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
                  Instantly Decode Your <br />
                  <span className="text-primary">SkillRack Stats</span>
                </h2>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Enter your SkillRack profile link and watch as we crunch your
                  coding points, daily challenges, and ranks in seconds.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-10 relative max-w-xl mx-auto"
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-blue-900/5 ring-1 ring-slate-100 p-2 border-2 border-transparent focus-within:border-primary transition-colors">
                    <div className="pl-4 pr-3 text-slate-400">
                      <LinkIcon className="w-6 h-6" />
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.skillrack.com/profile/..."
                      required
                      className="flex-1 py-3 px-2 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 outline-none w-full font-mono text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!url}
                      className="ml-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span>Analyze</span>
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="absolute -bottom-10 left-0 w-full text-center flex items-center justify-center gap-2 text-red-500 font-medium bg-red-50 py-1.5 px-4 rounded-full text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="my-auto flex flex-col items-center justify-center space-y-6 pb-20">
              <div className="relative">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="bg-white p-4 rounded-full shadow-lg border border-slate-100 relative z-10">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-slate-700 font-mono flex items-center">
                Fetching profile data ...
              </h3>
            </div>
          )}

          {/* Results View */}
          {data && !loading && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out pb-10">
              <div className="mb-6 flex items-center justify-between bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Profile successfully analyzed
                </div>
                <button
                  onClick={clearData}
                  className="text-sm font-medium text-slate-500 hover:text-primary transition-colors hover:bg-blue-50 px-3 py-1.5 rounded-md"
                >
                  Scan Another URL
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 border border-slate-200 bg-white rounded-3xl p-8 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>

                  <div className="flex flex-col items-center text-center space-y-4 relative z-10 mb-8 pt-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-400 text-white rounded-2xl shadow-lg flex items-center justify-center transform -rotate-3 group-hover:rotate-0 transition-transform">
                      <User className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {data.name}
                      </h2>
                      <p className="text-primary font-mono mt-1 font-medium">
                        {data.rollNumber}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 text-sm">
                    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                          Department
                        </p>
                        <p className="font-medium text-slate-800">
                          {data.dept}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                          College
                        </p>
                        <p className="font-medium text-slate-800">
                          {data.college}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                          Year Info
                        </p>
                        <p className="font-medium text-slate-800">
                          {data.yearInfo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                  {/* Top Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Solved Card */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-[2rem] p-8 md:p-10 border hover:border-slate-200 transition-colors border-slate-100/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                      <span className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-4">
                        Solved
                      </span>
                      <div className="flex items-center gap-4">
                        <Award className="w-8 h-8 md:w-10 md:h-10 text-green-500 stroke-[2.5]" />
                        <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight">
                          {data.totalSolved?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Points Card */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-[2rem] p-8 md:p-10 border hover:border-slate-200 transition-colors border-slate-100/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                      <span className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-4">
                        Points
                      </span>
                      <div className="flex items-center gap-4">
                        <Target className="w-8 h-8 md:w-10 md:h-10 text-indigo-500 stroke-[2.5]" />
                        <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight">
                          {data.points?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-slate-100/80 my-2"></div>

                  {/* Skill Overview */}
                  <div>
                    <h3 className="text-slate-400 font-bold tracking-widest text-sm mb-6 uppercase">
                      Skill Overview
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-5">
                      <SkillBox
                        title="DT"
                        value={data.dt}
                        colorVariant="blue"
                      />
                      <SkillBox
                        title="DC"
                        value={data.dc}
                        colorVariant="teal"
                      />
                      <SkillBox
                        title="Track"
                        value={data.codeTrack}
                        colorVariant="purple"
                      />
                      <SkillBox
                        title="Tutor"
                        value={data.codeTutor}
                        colorVariant="orange"
                      />
                      <SkillBox
                        title="Test"
                        value={data.codeTest}
                        colorVariant="red"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm font-medium text-slate-400">
          Last updated:{" "}
          {data ? data.lastFetched : new Date().toLocaleTimeString()}
        </footer>
      </div>
    </div>
  );
}

function SkillBox({ title, value, colorVariant }) {
  const colorMap = {
    blue: "bg-blue-50/80 text-blue-600 border-blue-100/50 hover:bg-blue-50",
    teal: "bg-teal-50/80 text-teal-600 border-teal-100/50 hover:bg-teal-50",
    purple:
      "bg-purple-50/80 text-purple-600 border-purple-100/50 hover:bg-purple-50",
    orange:
      "bg-orange-50/80 text-orange-600 border-orange-100/50 hover:bg-orange-50",
    red: "bg-red-50/80 text-red-600 border-red-100/50 hover:bg-red-50",
  };

  return (
    <div
      className={`rounded-[2rem] p-6 py-8 flex items-center justify-center flex-col gap-3 border transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-sm ${colorMap[colorVariant]}`}
    >
      <span className="font-bold text-sm tracking-wide">{title}</span>
      <span className="text-4xl font-black tracking-tight">{value}</span>
    </div>
  );
}
