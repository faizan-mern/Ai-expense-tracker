const pkrFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 2,
});

const monthFormatter = new Intl.DateTimeFormat("en-PK", {
  month: "long",
  year: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function toDateParts(value) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.length === 7 ? `${value}-01` : value;
  const [year, month, day] = normalizedValue.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function formatCurrency(value) {
  return pkrFormatter.format(Number(value || 0));
}

export function formatMonthLabel(value) {
  const date = toDateParts(value);

  if (!date) {
    return value || "";
  }

  return monthFormatter.format(date);
}

export function formatDateLabel(value) {
  const date = toDateParts(value);

  if (!date) {
    return value || "";
  }

  return dateFormatter.format(date);
}

export function formatDateTimeLabel(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateTimeFormatter.format(date);
}

export function getCurrentMonthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function splitBudgetMonth(value = getCurrentMonthValue()) {
  const [year = String(new Date().getFullYear()), month = "01"] = value.split("-");
  return { year, month };
}

export function buildBudgetMonthValue(year, month) {
  if (!year || !month) {
    return "";
  }

  return `${year}-${month}`;
}

export function getYearOptions(centerYear = new Date().getFullYear()) {
  return Array.from({ length: 7 }, (_, index) => String(centerYear - 2 + index));
}

export function getMonthDateRange(value) {
  const normalizedValue = value || getCurrentMonthValue();
  const [year, month] = normalizedValue.split("-").map(Number);

  if (!year || !month) {
    return {
      startDate: "",
      endDate: "",
    };
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);

  return {
    startDate,
    endDate: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(
      endDate.getDate()
    ).padStart(2, "0")}`,
  };
}
