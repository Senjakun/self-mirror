import { Code2, Infinity, Sparkles, Terminal } from "lucide-react";
import QuineDisplay from "@/components/QuineDisplay";
import RecursivePattern from "@/components/RecursivePattern";
import FeatureCard from "@/components/FeatureCard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 bg-radial-glow" />
      <RecursivePattern />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                <Infinity className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">quine</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <a href="#examples" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Examples
              </a>
              <a href="#learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Learn
              </a>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center mb-16">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/50 text-xs text-muted-foreground mb-6">
              <Sparkles className="w-3 h-3 text-primary" />
              Self-referential programs
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text text-glow">quine</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-light">
              A program that outputs its own source code
            </p>

            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Named after philosopher Willard Van Orman Quine, these self-replicating 
              programs represent the elegant intersection of mathematics, logic, and computer science.
            </p>
          </div>

          {/* Quine Display */}
          <div className="max-w-2xl mx-auto">
            <QuineDisplay />
          </div>
        </section>

        {/* Features Section */}
        <section id="about" className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                The Art of Self-Reference
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Quines embody fundamental concepts in computation theory and have 
                fascinating connections to Gödel's incompleteness theorems.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <FeatureCard
                icon={<Code2 className="w-6 h-6" />}
                title="Pure Logic"
                description="Quines work through clever string manipulation and the structure of code itself, without reading any external files."
              />
              <FeatureCard
                icon={<Infinity className="w-6 h-6" />}
                title="Fixed Point"
                description="In lambda calculus terms, a quine is a fixed point of the execution function—it maps to itself."
              />
              <FeatureCard
                icon={<Terminal className="w-6 h-6" />}
                title="Universal"
                description="Quines exist in virtually every programming language, each with unique constraints and elegance."
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Infinity className="w-4 h-4 text-primary" />
                <span>quine</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Exploring the beauty of self-referential code
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
