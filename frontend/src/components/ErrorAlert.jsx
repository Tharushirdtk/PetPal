export default function ErrorAlert({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4 flex justify-between items-center">
      <span className="text-sm">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-4 text-lg font-bold cursor-pointer">&times;</button>
      )}
    </div>
  );
}
