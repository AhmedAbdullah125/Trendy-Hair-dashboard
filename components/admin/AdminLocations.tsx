import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import GovernoratesTab from './locations/GovernoratesTab';
import CitiesTab from './locations/CitiesTab';

const AdminLocations: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'governorates' | 'cities'>('governorates');

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
                <Layers className="text-app-gold" size={28} />
                <h2 className="text-2xl font-bold text-app-text">المحافظات والمدن</h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-app-card/30 bg-white rounded-t-xl overflow-hidden shadow-sm">
                <button
                    onClick={() => setActiveTab('governorates')}
                    className={`flex-1 py-4 px-6 text-center font-bold text-sm transition-all relative ${activeTab === 'governorates'
                            ? 'text-app-gold bg-app-gold/5'
                            : 'text-app-textSec hover:text-app-text hover:bg-gray-50'
                        }`}
                >
                    المحافظات
                    {activeTab === 'governorates' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-app-gold rounded-t-full" />
                    )}
                </button>
                <div className="w-px bg-app-card/30"></div>
                <button
                    onClick={() => setActiveTab('cities')}
                    className={`flex-1 py-4 px-6 text-center font-bold text-sm transition-all relative ${activeTab === 'cities'
                            ? 'text-app-gold bg-app-gold/5'
                            : 'text-app-textSec hover:text-app-text hover:bg-gray-50'
                        }`}
                >
                    المدن
                    {activeTab === 'cities' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-app-gold rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-xl shadow-sm overflow-hidden p-6 border border-t-0 border-app-card/30">
                {activeTab === 'governorates' && <GovernoratesTab />}
                {activeTab === 'cities' && <CitiesTab />}
            </div>
        </div>
    );
};

export default AdminLocations;
