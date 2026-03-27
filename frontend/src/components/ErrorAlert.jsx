export default function ErrorAlert({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex justify-between items-center">
      <span className="text-sm">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-red-500 hover:text-red-700 ml-4 text-lg font-bold cursor-pointer">&times;</button>
      )}
    </div>
  );
}
