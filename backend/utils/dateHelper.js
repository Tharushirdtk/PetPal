function formatDate(date) {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
}

function formatDateTime(date) {
  if (!date) return null;
  return new Date(date).toISOString();
}

function calculateAge(birthYear, birthMonth, birthDay) {
  if (!birthYear) return null;
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  if (birthMonth && now.getMonth() + 1 < birthMonth) age--;
  else if (birthMonth && now.getMonth() + 1 === birthMonth && birthDay && now.getDate() < birthDay) age--;
  return age;
}

function calculateAgeMonths(birthYear, birthMonth) {
  if (!birthYear) return null;
  const now = new Date();
  let months = (now.getFullYear() - birthYear) * 12;
  if (birthMonth) months += now.getMonth() + 1 - birthMonth;
  return months;
}

module.exports = { formatDate, formatDateTime, calculateAge, calculateAgeMonths };
