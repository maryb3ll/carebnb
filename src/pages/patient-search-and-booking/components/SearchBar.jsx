import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const SearchBar = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useState({
    where: '',
    time: '',
    careType: '',
    name: ''
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const careTypeCategories = [
  {
    value: 'medical-visits',
    label: 'Medical Visits',
    services: [
    { value: 'cold-flu', label: 'Cold/Flu Care' },
    { value: 'fever-check', label: 'Fever Check' },
    { value: 'infection-monitoring', label: 'Infection Monitoring' },
    { value: 'medication-help', label: 'Medication Help' },
    { value: 'general-nurse', label: 'General Nurse Visit' }]

  },
  {
    value: 'clinical-procedures',
    label: 'Clinical Procedures',
    services: [
    { value: 'blood-draw', label: 'Blood Draw' },
    { value: 'iv-therapy', label: 'IV Therapy' },
    { value: 'injection', label: 'Injection Administration' },
    { value: 'chemo', label: 'Chemo Administration' },
    { value: 'wound-care', label: 'Wound Care' }]

  },
  {
    value: 'post-hospital',
    label: 'Post-Hospital Care',
    services: [
    { value: 'post-surgery', label: 'Post-Surgery Check' },
    { value: 'chronic-condition', label: 'Chronic Condition Monitoring' },
    { value: 'medication-management', label: 'Medication Management' },
    { value: 'vital-signs', label: 'Vital Signs Monitoring' }]

  },
  {
    value: 'support-care',
    label: 'Support Care',
    services: [
    { value: 'physical-therapy', label: 'Physical Therapy' },
    { value: 'lactation', label: 'Lactation Consultant' },
    { value: 'elder-support', label: 'Elder Support' },
    { value: 'palliative', label: 'Palliative Care' }]

  }];


  const getSelectedLabel = () => {
    if (!searchParams?.careType) return 'Select care type';

    for (const category of careTypeCategories) {
      const service = category?.services?.find((s) => s?.value === searchParams?.careType);
      if (service) return service?.label;
    }
    return searchParams?.careType;
  };

  const handleInputChange = (field, value) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceSelect = (serviceValue) => {
    handleInputChange('careType', serviceValue);
    setIsDropdownOpen(false);
    setHoveredCategory(null);
  };

  const handleSearch = () => {
    onSearch(searchParams);
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
      <div className="max-w-[1440px] mx-auto">
        <div className="bg-white rounded-full shadow-organic-md p-2 md:p-3 lg:p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-0 lg:divide-x divide-border">
            {/* Where */}
            <div className="flex-1 px-4 md:px-6 py-3 md:py-4">
              <label className="block font-medium mb-1 text-lg text-black">
                Where
              </label>
              <input
                type="text"
                placeholder="Enter your location"
                value={searchParams?.where}
                onChange={(e) => handleInputChange('where', e?.target?.value)}
                className="w-full text-sm md:text-base text-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none focus:ring-0" />
            </div>

            {/* Time */}
            <div className="flex-1 px-4 md:px-6 py-3 md:py-4">
              <label className="block font-medium mb-1 text-lg text-neutral-950">
                Time
              </label>
              <input
                type="datetime-local"
                value={searchParams?.time}
                onChange={(e) => handleInputChange('time', e?.target?.value)}
                className="w-full text-sm md:text-base text-foreground bg-transparent border-none outline-none focus:ring-0" />
            </div>

            {/* Type of Care - Hierarchical Dropdown */}
            <div className="flex-1 px-4 md:px-6 py-3 md:py-4 relative">
              <label className="block font-medium mb-1 text-[rgba(5,5,5,1)] text-lg">
                Type of Care
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => {
                  setTimeout(() => {
                    setIsDropdownOpen(false);
                    setHoveredCategory(null);
                  }, 200);
                }}
                className="w-full text-left text-sm md:text-base text-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none focus:ring-0 cursor-pointer flex items-center justify-between">

                <span className={!searchParams?.careType ? 'text-muted-foreground' : ''}>
                  {getSelectedLabel()}
                </span>
                <Icon name="ChevronDown" size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen &&
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[250px]">
                  {careTypeCategories?.map((category) =>
                <div
                  key={category?.value}
                  className="relative"
                  onMouseEnter={() => setHoveredCategory(category?.value)}
                  onMouseLeave={() => setHoveredCategory(null)}>

                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                        <span className="font-medium text-sm">{category?.label}</span>
                        <Icon name="ChevronRight" size={16} />
                      </div>

                      {/* Sub-menu */}
                      {hoveredCategory === category?.value &&
                  <div className="absolute left-full top-0 ml-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[220px]">
                          {category?.services?.map((service) =>
                    <div
                      key={service?.value}
                      onClick={() => handleServiceSelect(service?.value)}
                      className="px-4 py-2.5 hover:bg-primary hover:text-white cursor-pointer text-sm first:rounded-t-lg last:rounded-b-lg">

                              {service?.label}
                            </div>
                    )}
                        </div>
                  }
                    </div>
                )}
                </div>
              }
            </div>

            {/* Name */}
            <div className="flex-1 px-4 md:px-6 py-3 md:py-4">
              <label className="block font-medium mb-1 text-lg text-[rgba(7,8,8,1)]">Name

              </label>
              <input
                type="text"
                placeholder="Provider name (optional)"
                value={searchParams?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                className="w-full text-sm md:text-base text-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none focus:ring-0" />
            </div>

            {/* Search Button */}
            <div className="px-4 md:px-6 py-3 md:py-4 lg:py-0">
              <button
                onClick={handleSearch}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all duration-250 shadow-organic hover:shadow-organic-md"
                aria-label="Search for providers">
                <Icon name="Search" size={20} strokeWidth={2} />
                <span className="font-medium text-sm md:text-base">Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>);

};

export default SearchBar;