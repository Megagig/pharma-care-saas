import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  X,
  Rocket,
  BookOpen,
  Play,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

// Mock data and types
interface MTRHelpSystemProps {
  currentStep?: number;
  onStartTour?: () => void;
  onShowGuide?: () => void;
}

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: 'workflow' | 'features' | 'troubleshooting' | 'best-practices';
  keywords: string[];
}

const helpTopics: HelpTopic[] = [
  // ... (help topics data)
];

const MTRHelpSystem: React.FC<MTRHelpSystemProps> = ({ currentStep = 0, onStartTour }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTopics = helpTopics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === 'all' || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workflow': return <Play className="h-4 w-4" />;
      case 'features': return <Info className="h-4 w-4" />;
      case 'best-practices': return <CheckCircle className="h-4 w-4" />;
      case 'troubleshooting': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg" size="icon">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>MTR Help & Support</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-4">
          <Button className="w-full" onClick={onStartTour}>
            <Rocket className="mr-2 h-4 w-4" />
            Start Guided Tour
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <BookOpen className="mr-2 h-4 w-4" />
                View User Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>MTR User Guide</DialogTitle>
              </DialogHeader>
              {/* User Guide Content Here */}
            </DialogContent>
          </Dialog>

          <Separator />

          <div className="space-y-2">
            <Input
              placeholder="Search help topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2 flex-wrap">
              {[
                'all',
                'workflow',
                'features',
                'best-practices',
                'troubleshooting',
              ].map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'secondary'}
                  onClick={() => setSelectedCategory(category)}
                  className="cursor-pointer"
                >
                  {category.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {filteredTopics.map((topic) => (
              <AccordionItem key={topic.id} value={topic.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(topic.category)}
                    <span>{topic.title}</span>
                    <Badge variant="outline">{topic.category.replace('-', ' ')}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>{topic.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MTRHelpSystem;