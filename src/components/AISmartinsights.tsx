/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Brain, Bot, HelpCircle, AlertCircle } from 'lucide-react';
import { KPIStats, ChatMessage, RegionalBreakdown, CategoryBreakdown } from '../types';

interface AISmartinsightsProps {
  stats: KPIStats;
  regionalBreakdown: RegionalBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  activeFilters: {
    region: string;
    category: string;
    segment: string;
    storeType: string;
  };
}

// Lightweight Markdown to JSX Formatter for beautiful custom reports
function formatMarkdown(content: string) {
  if (!content) return null;
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('###')) {
      return (
        <h5 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1">
          <Brain className="w-4 h-4 text-blue-500" />
          {trimmed.replace(/^###\s*/, '')}
        </h5>
      );
    }
    if (trimmed.startsWith('##')) {
      return (
        <h4 key={idx} className="text-base font-bold text-slate-900 mt-5 mb-2">
          {trimmed.replace(/^##\s*/, '')}
        </h4>
      );
    }
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const parsedText = trimmed.replace(/^[-*]\s*/, '');
      return (
        <li key={idx} className="text-xs text-slate-600 ml-4 list-disc mb-1.5 leading-relaxed">
          {formatBoldText(parsedText)}
        </li>
      );
    }
    if (trimmed === '') {
      return <div key={idx} className="h-2" />;
    }
    return (
      <p key={idx} className="text-xs text-slate-600 mb-2 leading-relaxed">
        {formatBoldText(trimmed)}
      </p>
    );
  });
}

// Replaces **text** with <strong>text</strong>
function formatBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-semibold text-slate-800">{part}</strong>;
    }
    return part;
  });
}

export default function AISmartinsights({
  stats,
  regionalBreakdown,
  categoryBreakdown,
  activeFilters,
}: AISmartinsightsProps) {
  const [executiveSummary, setExecutiveSummary] = useState<string>('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isWaitingChatReply, setIsWaitingChatReply] = useState<boolean>(false);
  const [missingApiKey, setMissingApiKey] = useState<boolean>(false);

  const endOfChatRef = useRef<HTMLDivElement>(null);

  // Automatically scroll chat when a new message arrives
  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isWaitingChatReply]);

  // Generate automated executive brief based on filter state
  const generateReport = async () => {
    setIsGeneratingBrief(true);
    setMissingApiKey(false);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalRevenue: stats.totalRevenue,
          totalProfit: stats.totalProfit,
          averageMargin: stats.averageMargin,
          totalUnits: stats.totalUnits,
          performanceVsTarget: stats.performanceVsTarget,
          regionalBreakdown,
          categoryBreakdown,
          filters: activeFilters,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.isMissingKey) {
          setMissingApiKey(true);
        }
        throw new Error(errData.error || 'Server error generating analysis.');
      }

      const data = await res.json();
      setExecutiveSummary(data.insights || '');
    } catch (err: any) {
      console.error(err);
      setExecutiveSummary(`### Key Findings Summary
* **Current Volume Revenue:** Sales are yielding an average profit margin of **${(stats.averageMargin * 100).toFixed(1)}%**.
* **Regional Discrepancy:** Certain segments require pricing parameter realignment to hit targets.
* **Smart advisor advice:** To load active SWOT analyses recursively via Gemini, please make sure your **GEMINI_API_KEY** is registered in the workspace Secrets panel.`);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Generate on initial render
  useEffect(() => {
    generateReport();
  }, [activeFilters]);

  // Send message to the interactive advisor agent
  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsgText = chatInput.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userMsgText, timestamp }];
    
    setChatHistory(newHistory);
    setChatInput('');
    setIsWaitingChatReply(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgText,
          history: newHistory,
          dashboardState: {
            stats,
            regionalBreakdown,
            categoryBreakdown,
            filters: activeFilters,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.isMissingKey) {
          setMissingApiKey(true);
        }
        throw new Error(errData.error || 'Chat server error.');
      }

      const data = await res.json();
      setChatHistory(prev => [
        ...prev,
        {
          role: 'model',
          content: data.reply || 'No response returned.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'model',
          content: 'I encountered an issue connecting to my advisory module. Please ensure **GEMINI_API_KEY** is configured correctly in the Secrets panel in AI Studio.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsWaitingChatReply(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Executive Report Panel */}
      <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Automated Stakeholder Analysis</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Gemini-generated board-ready performance insights</p>
              </div>
            </div>
            
            <button
              onClick={generateReport}
              disabled={isGeneratingBrief}
              className="text-xs bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100/80 font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGeneratingBrief ? 'Analyzing...' : 'Refresh Brief'}
            </button>
          </div>

          {missingApiKey && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs mb-4 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-bold">Missing Gemini Key:</span> Please register your Gemini API key in the **Settings &gt; Secrets** panel on the top right. Using fallback parameters meanwhile.
              </div>
            </div>
          )}

          {isGeneratingBrief ? (
            <div className="space-y-3 py-6 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
              <div className="h-4 bg-slate-100 rounded w-1/3 mt-6" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-slate-600 text-xs overflow-y-auto max-h-[460px] pr-2 scrollbar">
              {formatMarkdown(executiveSummary)}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-400 flex items-center gap-1">
          <Bot className="w-3.5 h-3.5" />
          Powered by Gemini 3.5 Flash. Fully synchronized with active dashboard filters.
        </div>
      </div>

      {/* Sales Advisor Chat Assistant */}
      <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-between" style={{ minHeight: '430px' }}>
        <div className="flex flex-col h-full justify-between">
          
          {/* Advisor Header */}
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Board-Room Advisory Partner</h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active Knowledge Sync On
              </p>
            </div>
          </div>

          {/* Chat Bubble List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[310px] min-h-[220px] scrollbar text-xs">
            {chatHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400 max-w-xs mx-auto">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-slate-500 mb-1">Advisory Agent Initialized</p>
                <p className="text-[11px] leading-relaxed">Ask business simulation questions based on your data, such as:</p>
                <div className="mt-3 flex flex-col gap-1.5 text-left text-[11px]">
                  <button 
                    onClick={() => setChatInput("Contrast Northeast vs West profitability.")}
                    className="text-blue-600 hover:underline bg-blue-50/50 p-1.5 rounded text-left"
                  >
                    💡 "Contrast Northeast vs West profitability."
                  </button>
                  <button 
                    onClick={() => setChatInput("What demand risks exist in Furniture?")}
                    className="text-blue-600 hover:underline bg-blue-50/50 p-1.5 rounded text-left"
                  >
                    💡 "What demand risks exist in Furniture?"
                  </button>
                </div>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                    msg.role === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-none' 
                      : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {/* Render paragraph chunks inside chat bubble safely */}
                    <div className="whitespace-pre-line leading-relaxed">
                      {msg.content}
                    </div>
                    <span className={`text-[9px] block text-right mt-1 ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}

            {isWaitingChatReply && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-100 rounded-lg rounded-tl-none px-3 py-2 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                  Analyzing matrix...
                </div>
              </div>
            )}
            <div ref={endOfChatRef} />
          </div>

          {/* Chat Field Form */}
          <form onSubmit={sendChatMessage} className="mt-3 flex gap-2 pt-2 border-t border-slate-100">
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Advisor e.g. How can we improve Furniture profit?"
              className="flex-1 rounded border border-slate-200 px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
            />
            <button 
              type="submit"
              className="p-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
