import React, { useState } from "react";
import Markdown from "react-markdown";
import { generateBlueprint, generateWebsite } from "./services/geminiService";
import { Input, Select, Button } from "./components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, CheckCircle2, FileText, ArrowRight, Code, LayoutTemplate, Zap, ExternalLink, Mail, MessageCircle, Download, Monitor } from "lucide-react";
import { cn } from "./utils";

const Typewriter = ({ text, delay = 0.05, className }: { text: string; delay?: number; className?: string }) => {
  return (
    <span className={className}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.05,
            delay: i * delay,
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};

export default function App() {
  const [formData, setFormData] = useState({
    primaryKeyword: "",
    secondaryKeywords: "",
    pageType: "",
    targetAudience: "",
    searchIntent: "",
    location: "",
    brandVoice: "",
    styleType: "",
    designUiStyle: "",
    language: "English",
    images: "",
    videos: "",
    customStyle: "",
    email: "",
    whatsapp: "",
  });

  const [uploadedImages, setUploadedImages] = useState<{ name: string; date: string }[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<{ name: string; data: string }[]>([]);

  const [apiKey, setApiKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [provider, setProvider] = useState<"gemini" | "openai">("gemini");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingWebsite, setIsGeneratingWebsite] = useState(false);
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [websiteCode, setWebsiteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"blueprint" | "preview" | "code">("blueprint");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (type === 'image') {
          setUploadedImages(prev => [...prev, { name: file.name, date: dataUrl }]);
          // Auto-append to textarea for visibility
          setFormData(prev => ({
            ...prev,
            images: prev.images ? `${prev.images}\nUploaded: ${file.name}` : `Uploaded: ${file.name}`
          }));
        } else {
          setUploadedVideos(prev => [...prev, { name: file.name, data: dataUrl }]);
          setFormData(prev => ({
            ...prev,
            videos: prev.videos ? `${prev.videos}\nUploaded: ${file.name}` : `Uploaded: ${file.name}`
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFeelingLucky = () => {
    const ideas = [
      {
        primaryKeyword: "Crypto Staking Platform",
        secondaryKeywords: "high apy crypto, secure staking, web3 passive income",
        pageType: "Landing Page",
        targetAudience: "Crypto Investors, Web3 Enthusiasts",
        searchIntent: "Transactional",
        location: "Global",
        brandVoice: "Enthusiastic",
        styleType: "Direct",
        designUiStyle: "Dark Mode, Neon Accents, Cyberpunk, Web3",
        language: "English",
        images: "Hero image of a glowing 3D coin, dashboard screenshots",
        videos: "Background loop of blockchain nodes",
        customStyle: "Use neon colors, dark mode, and glowing buttons.",
        email: "hello@cryptostake.com",
        whatsapp: "+1234567890",
      },
      {
        primaryKeyword: "AI Marketing Agency",
        secondaryKeywords: "automated marketing, AI SEO, generative AI ads",
        pageType: "Service",
        targetAudience: "Marketing Directors, CMOs, Startup Founders",
        searchIntent: "Commercial",
        location: "New York",
        brandVoice: "Authoritative",
        styleType: "Data-Driven",
        designUiStyle: "Modern Corporate, Clean, Minimalist, Light Mode",
        language: "English",
        images: "Abstract AI network graphics, team photo",
        videos: "Client testimonial video",
        customStyle: "Include lots of statistics and ROI metrics.",
        email: "contact@aimarketing.io",
        whatsapp: "+1987654321",
      },
      {
        primaryKeyword: "Klinik Pergigian Kuala Lumpur",
        secondaryKeywords: "braces murah, pemutihan gigi, doktor gigi KL",
        pageType: "Local Page",
        targetAudience: "Local residents, families, students",
        searchIntent: "Informational",
        location: "Kuala Lumpur, Malaysia",
        brandVoice: "Approachable",
        styleType: "Educational",
        designUiStyle: "Warm, Medical, Trustworthy, Soft Colors",
        language: "Malay",
        images: "Smiling patients, clean clinic interior",
        videos: "Short tour of the clinic",
        customStyle: "Friendly tone, emphasize painless procedures.",
        email: "info@klinikgigi.my",
        whatsapp: "+60123456789",
      },
      {
        primaryKeyword: "Luxury Real Estate Shanghai",
        secondaryKeywords: "premium apartments, Shanghai villas, luxury property",
        pageType: "Landing Page",
        targetAudience: "High Net Worth Individuals, Investors",
        searchIntent: "Transactional",
        location: "Shanghai, China",
        brandVoice: "Professional",
        styleType: "Storytelling",
        designUiStyle: "Luxury, Elegant, Gold and Black, High-end",
        language: "Mandarin",
        images: "High-resolution photos of luxury interiors, skyline views",
        videos: "Cinematic drone tour of the property",
        customStyle: "Sophisticated language, focus on exclusivity.",
        email: "vip@shanghaiexclusive.cn",
        whatsapp: "+8613912345678",
      }
    ];
    const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
    setFormData(randomIdea);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setBlueprint(null);
    setCopied(false);

    try {
      const result = await generateBlueprint({
        primaryKeyword: formData.primaryKeyword,
        secondaryKeywords: formData.secondaryKeywords,
        pageType: formData.pageType,
        targetAudience: formData.targetAudience,
        searchIntent: formData.searchIntent,
        location: formData.location,
        brandVoice: formData.brandVoice,
        styleType: formData.styleType,
        designUiStyle: formData.designUiStyle,
        language: formData.language,
        images: formData.images,
        videos: formData.videos,
        customStyle: formData.customStyle,
        email: formData.email,
        whatsapp: formData.whatsapp,
        apiKey: provider === "gemini" ? apiKey : openAiKey,
        provider,
      });
      setBlueprint(result);
      setWebsiteCode(null);
      setActiveTab("blueprint");
    } catch (err: any) {
      setError(err.message || "Failed to generate blueprint. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWebsite = async () => {
    if (!blueprint) return;
    setIsGeneratingWebsite(true);
    setError(null);
    try {
      const result = await generateWebsite(blueprint, provider === "gemini" ? apiKey : openAiKey, provider);
      setWebsiteCode(result);
      setActiveTab("preview");
    } catch (err: any) {
      setError(err.message || "Failed to generate website. Please try again.");
    } finally {
      setIsGeneratingWebsite(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = activeTab === "blueprint" ? blueprint : websiteCode;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!websiteCode) return;
    const blob = new Blob([websiteCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.primaryKeyword.toLowerCase().replace(/\s+/g, "-")}-page.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreviewNewTab = () => {
    if (!websiteCode) return;
    const blob = new Blob([websiteCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen font-sans selection:bg-[#d4f75b]/50 selection:text-black pb-12">
      <header className="relative z-50 bg-[#030712]/80 backdrop-blur-md border-b border-white/5 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="bg-[#d4f75b] p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-white tracking-tight">SB</span>
          </motion.div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviewNewTab}
              disabled={!websiteCode}
              title={websiteCode ? "Open Website Preview in New Tab" : "Generate a blueprint to enable preview"}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 text-base font-mono tracking-widest font-bold rounded-none border-2 transition-all duration-300",
                websiteCode
                  ? "text-[#030712] bg-[#d4f75b] border-[#d4f75b] hover:bg-[#c2e549] hover:border-[#c2e549] shadow-[0_0_20px_rgba(212,247,91,0.6)] hover:shadow-[0_0_40px_rgba(212,247,91,0.8)] cursor-pointer"
                  : "text-[#d4f75b] bg-[#d4f75b]/10 border-[#d4f75b]/30 shadow-[0_0_15px_rgba(212,247,91,0.2)] opacity-80 cursor-not-allowed"
              )}
            >
              <Monitor className={cn("w-5 h-5", !websiteCode && "opacity-50")} />
              {websiteCode ? (
                <Typewriter text="WEBSITE PREVIEW" delay={0.05} key="ready" className="drop-shadow-md" />
              ) : (
                <Typewriter text="AWAITING INPUT..." delay={0.1} key="waiting" className="opacity-70" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#d4f75b]/10 to-transparent blur-[120px] -z-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
              className="bg-[#d4f75b] p-5 rounded-3xl shadow-[0_0_50px_rgba(212,247,91,0.4)] mb-8"
            >
              <Sparkles className="w-12 h-12 text-black" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6"
            >
              SEO <span className="text-[#d4f75b] drop-shadow-[0_0_30px_rgba(212,247,91,0.3)]">Blueprint</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                y: [0, -8, 0],
              }}
              transition={{
                opacity: { delay: 1.2, duration: 0.5 },
                y: {
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: 2 // Start moving after fade and typewriter
                }
              }}
              className="flex items-center gap-3 text-xl md:text-2xl font-medium text-slate-400"
            >
              <Zap className="w-6 h-6 text-[#9d8df1] animate-pulse" />
              <Typewriter text="AI Generator Pro" className="bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4 space-y-6"
          >
            <div className="glass-card rounded-[32px] overflow-hidden">
              <div className="px-6 py-6 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#9d8df1]" />
                    Strategy
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Define your page parameters.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleFeelingLucky}
                  className="text-xs px-4 py-2 h-auto bg-[#9d8df1]/10 text-[#9d8df1] hover:bg-[#9d8df1]/20 border-white/5 shadow-none"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  DEMO ME
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-6">
                  <button
                    type="button"
                    onClick={() => setProvider("gemini")}
                    className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all", provider === "gemini" ? "bg-brand-primary text-black shadow-lg" : "text-slate-400 hover:text-white")}
                  >
                    Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("openai")}
                    className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all", provider === "openai" ? "bg-brand-primary text-black shadow-lg" : "text-slate-400 hover:text-white")}
                  >
                    OpenAI
                  </button>
                </div>

                {provider === "gemini" ? (
                  <Input
                    id="apiKey"
                    type="password"
                    label="Gemini API Key (Optional)"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                ) : (
                  <Input
                    id="openAiKey"
                    type="password"
                    label="OpenAI API Key"
                    placeholder="sk-..."
                    value={openAiKey}
                    onChange={(e) => setOpenAiKey(e.target.value)}
                    required
                  />
                )}

                <Select
                  id="language"
                  label="Language *"
                  required
                  value={formData.language}
                  onChange={handleChange}
                  options={[
                    { value: "English", label: "English" },
                    { value: "Malay", label: "Malay" },
                    { value: "Mandarin", label: "Mandarin" },
                    { value: "Tamil", label: "Tamil" },
                  ]}
                />

                <Input
                  id="primaryKeyword"
                  label="Primary Keyword *"
                  placeholder="e.g., AI consulting services"
                  required
                  value={formData.primaryKeyword}
                  onChange={handleChange}
                />

                <Input
                  id="secondaryKeywords"
                  label="Secondary Keywords"
                  placeholder="e.g., machine learning consultant, AI strategy"
                  value={formData.secondaryKeywords}
                  onChange={handleChange}
                />

                <Select
                  id="pageType"
                  label="Page Type *"
                  required
                  value={formData.pageType}
                  onChange={handleChange}
                  options={[
                    { value: "Service", label: "Service Page" },
                    { value: "Blog", label: "Blog Post" },
                    { value: "Landing Page", label: "Landing Page" },
                    { value: "Local Page", label: "Local SEO Page" },
                    { value: "Product Page", label: "Product Page" },
                    { value: "Pillar Page", label: "Pillar Page" },
                  ]}
                />

                <Input
                  id="targetAudience"
                  label="Target Audience *"
                  placeholder="e.g., Enterprise CTOs, Small Business Owners"
                  required
                  value={formData.targetAudience}
                  onChange={handleChange}
                />

                <Select
                  id="searchIntent"
                  label="Search Intent *"
                  required
                  value={formData.searchIntent}
                  onChange={handleChange}
                  options={[
                    { value: "Informational", label: "Informational (Learn)" },
                    { value: "Commercial", label: "Commercial (Compare/Investigate)" },
                    { value: "Transactional", label: "Transactional (Buy/Act)" },
                    { value: "Navigational", label: "Navigational (Find specific page)" },
                  ]}
                />

                <Input
                  id="location"
                  label="Location (Local SEO)"
                  placeholder="e.g., Kuala Lumpur, New York"
                  value={formData.location}
                  onChange={handleChange}
                />

                <Select
                  id="brandVoice"
                  label="Brand Voice"
                  value={formData.brandVoice}
                  onChange={handleChange}
                  options={[
                    { value: "Professional", label: "Professional & Corporate" },
                    { value: "Authoritative", label: "Authoritative & Expert" },
                    { value: "Approachable", label: "Approachable & Friendly" },
                    { value: "Conversational", label: "Conversational & Casual" },
                    { value: "Enthusiastic", label: "Enthusiastic & Energetic" },
                    { value: "Empathetic", label: "Empathetic & Caring" },
                  ]}
                />

                <Select
                  id="styleType"
                  label="Type of Style"
                  value={formData.styleType}
                  onChange={handleChange}
                  options={[
                    { value: "Minimalist", label: "Minimalist & Clean" },
                    { value: "Data-Driven", label: "Data-Driven & Analytical" },
                    { value: "Storytelling", label: "Storytelling & Narrative" },
                    { value: "Direct", label: "Direct & Action-Oriented" },
                    { value: "Educational", label: "Educational & Informative" },
                  ]}
                />

                <Input
                  id="designUiStyle"
                  label="Design UI Style"
                  placeholder="e.g., Dark Mode Web3, Clean Corporate, Playful"
                  value={formData.designUiStyle}
                  onChange={handleChange}
                />

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="images" className="text-sm font-semibold text-slate-300">
                      Images (URLs or Descriptions)
                    </label>
                    <label className="cursor-pointer text-xs font-bold text-[#d4f75b] hover:text-[#c2e549] transition-colors flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Upload JPG/PNG
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'image')}
                      />
                    </label>
                  </div>
                  <textarea
                    id="images"
                    className="flex min-h-[80px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50 focus:border-[#9d8df1]/50 transition-all resize-y"
                    placeholder="e.g., Hero image of a rocket, https://example.com/img.png"
                    value={formData.images}
                    onChange={(e) => setFormData((prev) => ({ ...prev, images: e.target.value }))}
                  />
                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="text-[10px] bg-white/10 px-2 py-1 rounded-md text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                          {img.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="videos" className="text-sm font-semibold text-slate-300">
                      Videos (URLs or Descriptions)
                    </label>
                    <label className="cursor-pointer text-xs font-bold text-[#d4f75b] hover:text-[#c2e549] transition-colors flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Upload MP4
                      <input
                        type="file"
                        className="hidden"
                        accept="video/mp4,video/x-m4v,video/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'video')}
                      />
                    </label>
                  </div>
                  <textarea
                    id="videos"
                    className="flex min-h-[80px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50 focus:border-[#9d8df1]/50 transition-all resize-y"
                    placeholder="e.g., YouTube explainer link, background loop video"
                    value={formData.videos}
                    onChange={(e) => setFormData((prev) => ({ ...prev, videos: e.target.value }))}
                  />
                  {uploadedVideos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {uploadedVideos.map((vid, i) => (
                        <div key={i} className="text-[10px] bg-white/10 px-2 py-1 rounded-md text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                          {vid.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="customStyle" className="text-sm font-semibold text-slate-300">
                    Custom Style Request
                  </label>
                  <textarea
                    id="customStyle"
                    className="flex min-h-[80px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50 focus:border-[#9d8df1]/50 transition-all resize-y"
                    placeholder="e.g., Use a lot of bullet points..."
                    value={formData.customStyle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customStyle: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="email"
                    type="email"
                    label="Contact Email"
                    placeholder="hello@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    icon={<Mail className="w-4 h-4 text-brand-primary" />}
                  />
                  <Input
                    id="whatsapp"
                    type="tel"
                    label="WhatsApp Number"
                    placeholder="+1 234 567 8900"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    icon={
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    }
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    Generate Blueprint
                    {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Right Column: Output */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8"
          >
            <div className="glass-card rounded-[32px] min-h-[100vh] lg:h-[calc(100vh-160px)] flex flex-col overflow-hidden sticky top-24">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 bg-[#030712]/40 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-white">
                    Preview
                  </h2>
                  {blueprint && (
                    <div className="flex bg-white/5 p-1 rounded-full border border-white/5">
                      <button
                        onClick={() => setActiveTab("blueprint")}
                        className={cn("px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-2", activeTab === "blueprint" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                      >
                        <FileText className="w-4 h-4" />
                        Blueprint
                      </button>
                      <button
                        onClick={() => setActiveTab("preview")}
                        disabled={!websiteCode && !isGeneratingWebsite}
                        className={cn("px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-2 disabled:opacity-50", activeTab === "preview" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                      >
                        <LayoutTemplate className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => setActiveTab("code")}
                        disabled={!websiteCode && !isGeneratingWebsite}
                        className={cn("px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-2 disabled:opacity-50", activeTab === "code" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                      >
                        <Code className="w-4 h-4" />
                        Code
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {blueprint && !websiteCode && (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleGenerateWebsite}
                      isLoading={isGeneratingWebsite}
                      className="h-10 px-4 text-xs"
                    >
                      Generate Website
                    </Button>
                  )}
                  {((blueprint && activeTab === "blueprint") || (websiteCode && activeTab === "code")) && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCopy}
                        className="h-10 px-4 text-xs"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                      {websiteCode && activeTab === "code" && (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleDownload}
                          className="h-10 px-4 text-xs"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download HTML
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={cn("flex-1 flex flex-col", activeTab === "preview" ? "p-0 overflow-hidden" : "p-6 overflow-auto")}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm border border-red-500/20 flex items-start gap-3 mb-4 shrink-0"
                  >
                    <div className="mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {error}
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {!blueprint && !isLoading && !error && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 space-y-5 py-20"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                        <FileText className="w-10 h-10 text-slate-600" />
                      </div>
                      <div className="max-w-sm">
                        <p className="text-base font-bold text-white">No blueprint generated yet</p>
                        <p className="text-sm mt-2 text-slate-400">Fill out the parameters on the left to start crafting your SEO strategy.</p>
                      </div>
                    </motion.div>
                  )}

                  {(isLoading || isGeneratingWebsite) && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 space-y-6 py-20"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 bg-[#9d8df1]/10 rounded-full flex items-center justify-center border border-[#9d8df1]/20 animate-pulse">
                          <Sparkles className="w-10 h-10 text-[#9d8df1]" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-brand-primary border-t-transparent animate-spin"></div>
                      </div>
                      <div className="max-w-sm">
                        <p className="text-base font-bold text-white">
                          {isLoading ? "Crafting your blueprint..." : "Generating website code..."}
                        </p>
                        <p className="text-sm mt-2 text-slate-400">
                          {isLoading ? "Analyzing search intent and structuring headings." : "Writing HTML and Tailwind CSS based on your blueprint."}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {blueprint && activeTab === "blueprint" && !isLoading && (
                    <motion.div
                      key="blueprint"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="prose prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-[#9d8df1] prose-h3:text-lg prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-a:text-[#d4f75b] hover:prose-a:text-[#9d8df1]"
                    >
                      <Markdown>{blueprint}</Markdown>
                    </motion.div>
                  )}

                  {websiteCode && activeTab === "preview" && !isGeneratingWebsite && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-1 w-full bg-white h-full"
                    >
                      <iframe
                        srcDoc={websiteCode}
                        className="w-full h-full border-0"
                        title="Website Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </motion.div>
                  )}

                  {websiteCode && activeTab === "code" && !isGeneratingWebsite && (
                    <motion.div
                      key="code"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex-1 w-full overflow-hidden flex flex-col"
                    >
                      <pre className="flex-1 p-6 bg-black/40 text-slate-300 rounded-2xl border border-white/10 overflow-auto text-sm font-mono whitespace-pre-wrap">
                        <code>{websiteCode}</code>
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </main >
    </div >
  );
}
