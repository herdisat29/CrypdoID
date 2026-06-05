import ArchetypeQuiz from './ArchetypeQuiz';
import { useEffect } from 'react';

interface QuizViewProps {
  setView?: (view: 'dashboard' | 'quiz' | 'security' | 'learning' | 'missions' | 'assistant') => void;
}

export default function QuizView({ setView }: QuizViewProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  return <ArchetypeQuiz setView={setView} />;
}
