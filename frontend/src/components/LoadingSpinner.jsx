const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const classes = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${classes} border-[#7C3AED] dark:border-[#A78BFA] border-t-transparent rounded-full animate-spin`} />
    </div>
  );
};

export default LoadingSpinner;
