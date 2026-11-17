import React from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaceholderViewProps {
  title: string;
  moduleName: string;
  description: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  title,
  moduleName,
  description,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
            {moduleName}
          </span>
          <h2 className="text-xl font-bold text-[#002B49] mt-0.5">{title}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="p-8 text-center max-w-2xl mx-auto my-8">
        <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4">
          <Info className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg font-bold text-slate-900">{title}</CardTitle>
        <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
            Return to Role Overview
          </Button>
        </div>
      </Card>
    </div>
  );
};
