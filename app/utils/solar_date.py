import jdatetime
from typing import Optional


def validate_jalali_date_str(date_str: str) -> bool:
    """
    Checks if a string is a valid Jalali date formatted as YYYY/MM/DD.
    Example valid: '1403/07/23', '1402/12/29'
    """
    if not date_str or not isinstance(date_str, str):
        return False

    parts = date_str.strip().split("/")
    if len(parts) != 3:
        return False

    try:
        year = int(parts[0])
        month = int(parts[1])
        day = int(parts[2])

        # jdatetime.date will raise ValueError if month > 12 or day is invalid for that month
        jdatetime.date(year, month, day)
        return True
    except (ValueError, TypeError):
        return False


def get_current_jalali_date() -> str:
    """Returns today's date in Shamsi format: YYYY/MM/DD"""
    today = jdatetime.date.today()
    return f"{today.year:04d}/{today.month:02d}/{today.day:02d}"