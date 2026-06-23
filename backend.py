import os
import time
import pandas as pd
from openai import OpenAI


def get_openai_api_key():
    """
    Reads OpenAI API key from Streamlit secrets first,
    then from environment variable.
    """
    try:
        import streamlit as st
        if "OPENAI_API_KEY" in st.secrets:
            return st.secrets["OPENAI_API_KEY"]
    except Exception:
        pass

    return os.getenv("OPENAI_API_KEY")


def safe_numeric(df, column):
    if column in df.columns:
        return pd.to_numeric(df[column], errors="coerce")
    return None


def build_context_from_dataframe(df: pd.DataFrame) -> str:
    """
    Builds compact context from the dataframe already loaded in Streamlit.
    This avoids sending raw rows to GPT-4o.
    """

    df = df.copy()

    if "ordered_on" in df.columns:
        df["ordered_on"] = pd.to_datetime(df["ordered_on"], errors="coerce")

    if "sales_dollars" in df.columns:
        df["sales_dollars"] = pd.to_numeric(df["sales_dollars"], errors="coerce")

    if "sales_bottles" in df.columns:
        df["sales_bottles"] = pd.to_numeric(df["sales_bottles"], errors="coerce")

    if "sales_dollars" not in df.columns:
        return f"""
The uploaded dataset has {df.shape[0]:,} rows and {df.shape[1]} columns.
Columns available: {list(df.columns)}
The dataset does not contain a sales_dollars column, so revenue calculations are not available.
"""

    df = df.dropna(subset=["sales_dollars"])

    context_parts = []

    context_parts.append(
        f"""
DATASET SUMMARY:
Rows analyzed: {df.shape[0]:,}
Columns: {df.shape[1]}
Column names: {list(df.columns)}
Total sales revenue: ${df["sales_dollars"].sum():,.2f}
"""
    )

    if "sales_bottles" in df.columns:
        context_parts.append(
            f"Total bottles sold: {df['sales_bottles'].sum():,.0f}"
        )

    if "ordered_on" in df.columns and df["ordered_on"].notna().any():
        context_parts.append(
            f"Date range: {df['ordered_on'].min().date()} to {df['ordered_on'].max().date()}"
        )

        monthly = (
            df.groupby(df["ordered_on"].dt.to_period("M"))["sales_dollars"]
            .sum()
            .reset_index()
        )
        monthly.columns = ["month", "total_sales"]
        monthly["month"] = monthly["month"].dt.to_timestamp()

        context_parts.append(
            "\nMONTHLY SALES REVENUE:\n"
            + monthly.to_string(index=False)
        )

        if len(monthly) >= 2:
            first_month = monthly.iloc[0]["total_sales"]
            last_month = monthly.iloc[-1]["total_sales"]
            pct_change = ((last_month - first_month) / first_month) * 100

            mean_sales = monthly["total_sales"].mean()
            monthly["deviation"] = abs(monthly["total_sales"] - mean_sales)
            anomaly_row = monthly.loc[monthly["deviation"].idxmax()]

            context_parts.append(
                f"""
TREND:
First month revenue: ${first_month:,.2f}
Last month revenue: ${last_month:,.2f}
Overall change: {pct_change:+.1f}%

ANOMALY:
Largest monthly deviation: {anomaly_row["month"].strftime("%B %Y")}
Revenue: ${anomaly_row["total_sales"]:,.2f}
Deviation from monthly mean: ${anomaly_row["deviation"]:,.2f}
"""
            )

    group_columns = {
        "store_name": "TOP STORES BY REVENUE",
        "im_desc": "TOP PRODUCTS BY REVENUE",
        "county_name": "TOP COUNTIES BY REVENUE",
        "vendor_name": "TOP VENDORS BY REVENUE"
    }

    for col, title in group_columns.items():
        if col in df.columns:
            top_table = (
                df.groupby(col)["sales_dollars"]
                .sum()
                .sort_values(ascending=False)
                .head(10)
                .reset_index()
            )

            context_parts.append(
                f"\n{title}:\n{top_table.to_string(index=False)}"
            )

    context_parts.append(
        """
PROJECT FORECAST REFERENCE:
The project notebook's baseline linear regression forecast predicts June 2026 revenue as $42,899,748.
Monthly growth rate: $651,904 per month.
R-squared score: 0.5942.
Limitation: linear regression cannot fully capture seasonal spikes.
"""
    )

    return "\n".join(context_parts)


def ask_gpt4o(question: str, df: pd.DataFrame) -> dict:
    """
    Sends the user's question and compact pandas-generated context to GPT-4o.
    """

    api_key = get_openai_api_key()
    
    if not api_key:
        return {
        "text": (
            "GPT-4o API key is not configured. "
            "Set OPENAI_API_KEY in Streamlit Secrets or as an environment variable."
        ),
        "citation": "No API key configured | Live GPT-4o call skipped"
    }

    context = build_context_from_dataframe(df)

    client = OpenAI(api_key=api_key)

    start = time.time()

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0,
        max_tokens=450,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a data analyst. Answer only using the provided pandas-generated context. "
                    "Do not invent numbers. If the answer is not available in the context, say so clearly. "
                    "Be concise and include specific values when available."
                )
            },
            {
                "role": "user",
                "content": f"{context}\n\nUser question: {question}"
            }
        ]
    )

    latency = round(time.time() - start, 2)

    return {
        "text": response.choices[0].message.content.strip(),
        "citation": f"Pandas pre-aggregated context + GPT-4o API | Latency: {latency}s"
    }

def ask_gpt4o_from_context(question: str, context: str) -> dict:
    """
    Sends a user question and pre-aggregated text context to GPT-4o.
    Used for large uploaded CSV files where loading the full dataframe into memory is not ideal.
    """

    api_key = get_openai_api_key()

    if not api_key:
        return {
            "text": (
                "GPT-4o API key is not configured. "
                "Set OPENAI_API_KEY in Streamlit Secrets or as an environment variable."
            ),
            "citation": "No API key configured | Live GPT-4o call skipped"
        }

    client = OpenAI(api_key=api_key)

    start = time.time()

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0,
        max_tokens=450,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a data analyst. Answer only using the provided uploaded CSV summary context. "
                    "Do not invent numbers. If the answer is not available in the context, say so clearly. "
                    "Be concise and include specific values when available."
                )
            },
            {
                "role": "user",
                "content": f"{context}\n\nUser question: {question}"
            }
        ]
    )

    latency = round(time.time() - start, 2)

    return {
        "text": response.choices[0].message.content.strip(),
        "citation": f"Uploaded CSV chunk summary + GPT-4o API | Latency: {latency}s"
    }