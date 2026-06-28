import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Wallet } from "lucide-react";

const NAMES = [
  "Muhammad Ali","Ahmed Khan","Zaid Hassan","Usman Tariq","Bilal Raza","Faisal Iqbal","Hassan Noor","Imran Shah","Junaid Malik","Kamran Syed",
  "Lahore Boy","Mubarak Javed","Nadeem Butt","Omar Farooq","Qasim Raza","Rizwan Chaudhry","Salman Aziz","Tariq Mehmood","Umar Ghani","Waheed Rana",
  "Yasir Nawaz","Zubair Saeed","Adnan Mirza","Babar Sattar","Daniyal Sheikh","Ejaz Qureshi","Fahad Akram","Ghulam Hussain","Hamid Latif","Irfan Lodhi",
  "Jawad Niazi","Khurram Shafi","Luqman Rauf","Mudassar Gill","Nasir Janjua","Owais Zaidi","Pervez Akhtar","Rashid Cheema","Shahid Abbasi","Tahir Gondal",
  "Umair Chaudhry","Waqas Haider","Xahoor Ahmed","Yousuf Baig","Zahid Memon","Aqeel Masood","Baber Waseem","Danial Asif","Ehtisham Nawaz","Farhan Raja",
  "Ghazi Rehman","Hasan Zahoor","Ismail Baloch","Jalal Uddin","Kashif Rana","Liaquat Shah","Mansoor Qazi","Nauman Aslam","Obaid Shakoor","Parvez Noon",
  "Qazi Arslan","Rahat Hussain","Sarfraz Bhatti","Tayyab Ahsan","Usman Gul","Wahaj Siddiqui","Yaseen Anwar","Zohaib Munir","Ahsan Bajwa","Bilal Abbasi",
  "Chaudhry Ikram","Daud Butt","Ehsan Malik","Farrukh Nisar","Gulzar Chishti","Hamza Waqas","Ijaz Awan","Jalees Haider","Khawaja Shams","Laeeq Ahmed",
  "Mirza Saqib","Nadir Hassan","Obaid Younis","Pasha Kamran","Qurban Ali","Reza Haider","Sibtain Haider","Tanveer Gill","Uzair Rafiq","Waris Bajwa",
  "Yaqoob Saeed","Zain Kazmi","Asim Chaudhry","Burhan Sheikh","Daniyal Qazi","Faiz Jilani","Habib Rehman","Imtiaz Memon","Junaid Qureshi","Kasim Akhtar",
  "Luqman Shah","Murtaza Rana","Naveed Gondal","Osama Gill","Qamar Zaman","Rafaqat Hussain","Saqib Mian","Touseef Butt","Umar Kashmiri","Waqar Naseer",
  "Yahya Khalil","Zulfiqar Ali","Arshad Mehmood","Basit Rehman","Dawood Niazi","Fawad Chaudhry","Hamid Saeed","Iqbal Munir","Javed Akhtar","Khalil Rahman",
  "Manzoor Ahmed","Noman Sattar","Omer Baloch","Qadir Butt","Raees Khan","Saboor Shah","Taimur Mirza","Usama Tariq","Waseem Baig","Zeeshan Anwar",
  "Ali Raza","Babar Azam","Daniyal Baig","Farrukh Butt","Haris Saleem","Irfan Shah","Jawad Rehman","Kamil Hassan","Luqman Iqbal","Muzamil Ahmed",
  "Nadia Akhtar","Sana Malik","Ayesha Tariq","Fatima Raza","Hina Shah","Zara Hussain","Amina Khan","Rabia Chaudhry","Saima Butt","Noor Jahan",
  "Maryam Siddiqui","Uzma Baig","Mehwish Rana","Kiran Akhtar","Laiba Sheikh","Bisma Anwar","Iqra Nawaz","Zainab Mirza","Madiha Aslam","Rubab Shah",
  "Sidra Hassan","Nimra Rehman","Asma Qureshi","Fiza Mehmood","Huma Iqbal","Jaweria Malik","Kalsoom Tariq","Lubna Haider","Mahvish Butt","Naila Chaudhry",
  "Rida Javed","Sumera Baloch","Tahira Gondal","Urooj Memon","Vaneeza Ahmed","Wajiha Saeed","Yasmin Khan","Zara Nawaz","Aleena Raza","Bushra Awan",
  "Dua Hassan","Emaan Haider","Fareeha Niazi","Gul Naz","Hafsa Sheikh","Iqra Tariq","Juveria Rana","Khadija Butt","Lalarukh Mirza","Maaz Khan",
  "Nayab Hussain","Obaid Aziz","Palwasha Iqbal","Qudsia Rehman","Rabia Nawaz","Sehar Mehmood","Tehreem Gondal","Umaima Syed","Valeria Malik","Warda Shah",
];

const AMOUNTS = [250, 350, 500, 650, 800, 1000, 1200, 1500, 1800, 2000, 2500, 3000, 4000, 5000];
const METHODS = ["OPay", "Mashreq Bank", "OPay", "OPay", "Mashreq Bank"];
const TIMES = ["just now", "1 min ago", "2 mins ago", "3 mins ago", "5 mins ago", "8 mins ago"];

function maskName(name: string) {
  const parts = name.split(" ");
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} ${last[0]}.`;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function maskAccount(method: string, seed: number) {
  if (method === "OPay") {
    const suffix = String(Math.floor(100 + seededRandom(seed + 99) * 900));
    return `0337****${suffix}`;
  }
  const suffix = String(Math.floor(10 + seededRandom(seed + 77) * 89));
  return `08912****${suffix}`;
}

function generatePayouts(count = 80) {
  return Array.from({ length: count }, (_, i) => {
    const r = (offset: number) => seededRandom(i * 17 + offset);
    const name = NAMES[Math.floor(r(1) * NAMES.length)];
    const amount = AMOUNTS[Math.floor(r(2) * AMOUNTS.length)];
    const method = METHODS[Math.floor(r(3) * METHODS.length)];
    const time = TIMES[Math.floor(r(4) * TIMES.length)];
    return { name: maskName(name), account: maskAccount(method, i * 17 + 5), amount, method, time };
  });
}

const PAYOUTS = generatePayouts(80);

const TICKER_DURATION_MS = 90_000;

/* ── Horizontal marquee ticker ─────────────────── */
export function PayoutTicker() {
  const doubled = [...PAYOUTS, ...PAYOUTS];

  // Negative delay syncs the animation to real wall-clock time so it never
  // appears to restart on refresh — it always picks up exactly where it
  // would be if it had been running continuously since the Unix epoch.
  const offsetMs = Date.now() % TICKER_DURATION_MS;
  const animationDelay = `-${offsetMs}ms`;

  return (
    <div className="w-full overflow-hidden bg-white/8 backdrop-blur border-y border-white/10 py-2.5">
      <div
        className="flex gap-0 animate-ticker whitespace-nowrap"
        style={{ animationDelay }}
      >
        {doubled.map((p, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-5 text-white/90 shrink-0"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">{p.name}</span>
            <span className="opacity-60">·</span>
            <span className="opacity-70 font-mono text-[10px]">{p.account}</span>
            <span className="opacity-60">·</span>
            <span className="text-emerald-300 font-bold">₨{p.amount.toLocaleString()}</span>
            <span className="opacity-50">{p.method}</span>
            <span className="opacity-40 text-[10px]">{p.time}</span>
            <span className="opacity-20 mx-2">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Floating notification (dashboard) ────────── */
export function PayoutFloatingNotification() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(PAYOUTS[0]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const show = () => {
      const nextIdx = Math.floor(Math.random() * PAYOUTS.length);
      setIdx(nextIdx);
      setCurrent(PAYOUTS[nextIdx]);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        timerRef.current = setTimeout(show, 4000 + Math.random() * 3000);
      }, 5000);
    };

    timerRef.current = setTimeout(show, 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-4 z-50 transition-[opacity,transform] duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{ maxWidth: 300 }}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-gray-900/95 backdrop-blur-md shadow-2xl shadow-black/40 px-4 py-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center shrink-0 shadow-lg">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wide">Withdrawal Sent</div>
          <div className="text-sm font-semibold text-white truncate">{current.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-mono text-white/50">{current.account}</span>
            <span className="text-white/30">·</span>
            <span className="text-sm font-black text-emerald-400">₨{current.amount.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">{current.method} · {current.time}</div>
        </div>
        <div className="shrink-0 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>
    </div>
  );
}
