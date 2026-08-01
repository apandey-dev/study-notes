import React, { useState, useEffect } from 'react';
import { X, Search, ChevronDown, ChevronUp, Replace, RefreshCw } from 'lucide-react';

export default function SearchOverlay({ isOpen, isReplaceMode, onClose, editor }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  // Toggle Chips
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [wrapAround, setWrapAround] = useState(true);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
    } else {
      setMatchCount(0);
      setMatchIndex(0);
    }
  }, [searchTerm, matchCase, wholeWord]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        if (editor) editor.commands.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editor, onClose]);

  if (!isOpen || !editor) return null;

  const handleSearch = (term) => {
    if (!term || !term.trim()) {
      setMatchCount(0);
      setMatchIndex(0);
      return;
    }

    try {
      const fullText = editor.getText();
      let regexFlags = matchCase ? 'g' : 'gi';
      let pattern = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const regex = new RegExp(pattern, regexFlags);
      const matches = fullText.match(regex);
      const count = matches ? matches.length : 0;
      setMatchCount(count);
      if (count > 0 && matchIndex === 0) {
        setMatchIndex(1);
      }
    } catch (e) {
      setMatchCount(0);
    }
  };

  const handleNext = () => {
    if (matchCount === 0) return;
    if (matchIndex < matchCount) {
      setMatchIndex(matchIndex + 1);
    } else if (wrapAround) {
      setMatchIndex(1);
    }
  };

  const handlePrev = () => {
    if (matchCount === 0) return;
    if (matchIndex > 1) {
      setMatchIndex(matchIndex - 1);
    } else if (wrapAround) {
      setMatchIndex(matchCount);
    }
  };

  const handleReplace = () => {
    if (!searchTerm || !editor) return;
    const html = editor.getHTML();
    let regexFlags = matchCase ? '' : 'i';
    let pattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) pattern = `\\b${pattern}\\b`;
    const regex = new RegExp(pattern, regexFlags);
    const updatedHtml = html.replace(regex, replaceTerm);
    editor.commands.setContent(updatedHtml);
    handleSearch(searchTerm);
  };

  const handleReplaceAll = () => {
    if (!searchTerm || !editor) return;
    const html = editor.getHTML();
    let regexFlags = matchCase ? 'g' : 'gi';
    let pattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) pattern = `\\b${pattern}\\b`;
    const regex = new RegExp(pattern, regexFlags);
    const updatedHtml = html.replaceAll(regex, replaceTerm);
    editor.commands.setContent(updatedHtml);
    handleSearch(searchTerm);
  };

  return (
    <div className="find-floating-panel">
      {/* Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="#0078D4" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {isReplaceMode ? 'Find & Replace' : 'Find in Note'}
          </span>
        </div>

        {/* Live Result Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: matchCount > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
            {matchCount > 0 ? `${matchIndex} / ${matchCount} Results` : '0 Results'}
          </span>

          <button 
            className="btn-compact" 
            style={{ width: 26, height: 26, padding: 0, borderRadius: 6 }} 
            onClick={() => { onClose(); if (editor) editor.commands.focus(); }}
            title="Close Panel (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Find Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            type="text"
            className="find-panel-input"
            placeholder="Find in current note..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
            autoFocus
          />
        </div>

        {/* Replace Input */}
        {isReplaceMode && (
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text"
              className="find-panel-input"
              placeholder="Replace with..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Search Option Toggle Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <button 
          className={`chip-toggle ${matchCase ? 'active' : ''}`}
          onClick={() => setMatchCase(!matchCase)}
        >
          Match Case
        </button>

        <button 
          className={`chip-toggle ${wholeWord ? 'active' : ''}`}
          onClick={() => setWholeWord(!wholeWord)}
        >
          Whole Word
        </button>

        <button 
          className={`chip-toggle ${wrapAround ? 'active' : ''}`}
          onClick={() => setWrapAround(!wrapAround)}
        >
          Wrap Around
        </button>
      </div>

      {/* Action Buttons (Identical Height: 32px) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
        <button className="btn-compact" style={{ height: 32, fontSize: 12 }} onClick={handlePrev} disabled={matchCount === 0}>
          <ChevronUp size={14} />
          <span>Prev</span>
        </button>

        <button className="btn-compact" style={{ height: 32, fontSize: 12 }} onClick={handleNext} disabled={matchCount === 0}>
          <ChevronDown size={14} />
          <span>Next</span>
        </button>

        {isReplaceMode && (
          <>
            <button className="btn-compact" style={{ height: 32, fontSize: 12 }} onClick={handleReplace} disabled={matchCount === 0}>
              <Replace size={13} />
              <span>Replace</span>
            </button>

            <button className="btn-compact-primary" style={{ height: 32, fontSize: 12, padding: '0 12px' }} onClick={handleReplaceAll} disabled={matchCount === 0}>
              <RefreshCw size={13} />
              <span>Replace All</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
