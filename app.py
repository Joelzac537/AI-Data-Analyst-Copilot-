import streamlit as st
import pandas as pd
import numpy as np
import altair as alt
from backend import ask_gpt4o

# Set page config for a premium wide layout
st.set_page_config(
    page_title="Iowa Liquor Sales Intelligence Dashboard",
    page_icon="🥃",
    layout="wide",
    initial_sidebar_state="expanded"
)

# App Title & Description in Sidebar
st.sidebar.title("🥃 Iowa Liquor Sales")
st.sidebar.markdown(
    "NLP Feasibility Study & Sales Forecasting (EAI 6010)"
)
st.sidebar.divider()

# Load and Cache Iowa Liquor Sales dataset directly from Iowa Data Hub
# Load and Cache Iowa Liquor Sales dataset directly from Iowa Data Hub
@st.cache_data(show_spinner="Loading full Iowa Liquor Sales 2025 dataset...")
def load_cached_data():
    SAMPLE_URL = "https://idh-be.iowa.gov/api/v1/datasets/1262/rows.csv"

    use_cols = [
        "ordered_on",
        "store_name",
        "im_desc",
        "county_name",
        "vendor_name",
        "sales_dollars",
        "sales_bottles",
        "sales_liters",
        "bottle_volume_ml"
    ]

    df = pd.read_csv(
        SAMPLE_URL,
        usecols=use_cols,
        low_memory=False
    )

    df["ordered_on"] = pd.to_datetime(df["ordered_on"], errors="coerce")
    df["sales_dollars"] = pd.to_numeric(df["sales_dollars"], errors="coerce")
    df["sales_bottles"] = pd.to_numeric(df["sales_bottles"], errors="coerce")
    df["sales_liters"] = pd.to_numeric(df["sales_liters"], errors="coerce")
    df["bottle_volume_ml"] = pd.to_numeric(df["bottle_volume_ml"], errors="coerce")

    df = df.dropna(subset=["ordered_on", "sales_dollars"])

    return df


# Sidebar Navigation Mode Selector
nav_page = st.sidebar.radio(
    "Navigation Menu",
    [
        "Overview & EDA",
        "GPT-4o Evaluation",
        "Sales Forecasting",
        "RAG Chat Assistant",
        "Custom CSV Upload"
    ]
)

# Load main Iowa dataset only on pages that need it
main_data_pages = [
    "Overview & EDA",
    "Sales Forecasting",
    "RAG Chat Assistant"
]

if nav_page in main_data_pages:
    df = load_cached_data()
    st.sidebar.success(f"Cached {df.shape[0]:,} rows successfully!")
else:
    df = None

# Helper function to format currencies nicely
def fmt_curr(val):
    return f"${val:,.2f}"

# ==========================================
# PAGE 1: OVERVIEW & EDA
# ==========================================
if nav_page == "Overview & EDA":
    st.title("📊 Overview & Exploratory Data Analysis")
    st.markdown(
        "A macro-level dashboard illustrating the total sales revenue, volume metrics, and top distributors for the full-year 2025."
    )

    # Summary KPI Cards
    col1, col2, col3, col4 = st.columns(4)

    total_sales = df['sales_dollars'].sum()
    total_bottles = df['sales_bottles'].sum()
    unique_stores = df['store_name'].nunique()
    unique_products = df['im_desc'].nunique()

    col1.metric("Total Sales Revenue", fmt_curr(total_sales))
    col2.metric("Total Bottles Sold", f"{int(total_bottles):,}")
    col3.metric("Unique Stores", f"{unique_stores:,}")
    col4.metric("Unique Products", f"{unique_products:,}")

    st.divider()

    # Split screen for Monthly Sales Graph and Top 10 Lists
    g_col1, g_col2 = st.columns([1.7, 1], gap="large")

    with g_col1:
        st.subheader("Monthly Sales Revenue Trend (2025)")

        df_monthly = (
            df.groupby(df['ordered_on'].dt.to_period('M'))['sales_dollars']
            .sum()
            .reset_index()
        )

        df_monthly.columns = ['month', 'sales_dollars']
        df_monthly['month'] = df_monthly['month'].dt.to_timestamp()
        df_monthly = df_monthly.sort_values('month')

        df_monthly['Month'] = df_monthly['month'].dt.strftime('%b %Y')
        month_order = df_monthly['Month'].tolist()

        chart = (
            alt.Chart(df_monthly)
            .mark_line(point=True)
            .encode(
                x=alt.X(
                    'Month:N',
                    sort=month_order,
                    title='Month',
                    axis=alt.Axis(labelAngle=0)
                ),
                y=alt.Y(
                    'sales_dollars:Q',
                    title='Revenue ($)',
                    axis=alt.Axis(format='$,.0f')
                ),
                tooltip=[
                    alt.Tooltip('Month:N', title='Month'),
                    alt.Tooltip('sales_dollars:Q', title='Revenue', format='$,.2f')
                ]
            )
            .properties(height=360)
        )

        st.altair_chart(chart, width="stretch")

    with g_col2:
        st.subheader("Top 10 Rankings")

        rank_type = st.selectbox(
            "Rank By Category",
            ["Stores", "Products", "Counties", "Vendors"]
        )

        col_map = {
            "Stores": "store_name",
            "Products": "im_desc",
            "Counties": "county_name",
            "Vendors": "vendor_name"
        }

        selected_col = col_map[rank_type]
        top10 = (
            df.groupby(selected_col)['sales_dollars']
            .sum()
            .sort_values(ascending=False)
            .head(10)
            .reset_index()
        )

        top10.columns = [rank_type[:-1] + " Name", "Total Sales ($)"]

        st.dataframe(
            top10.style.format({"Total Sales ($)": "${:,.2f}"}),
            width="stretch",
            height=420
        )
# ==========================================
# PAGE 2: GPT-4o EVALUATION
# ==========================================
elif nav_page == "GPT-4o Evaluation":
    st.title("🤖 GPT-4o Prompt Performance Evaluation")
    st.markdown(
        "We tested GPT-4o's ability to reason over the 2025 Iowa Liquor Sales dataset. These results are compared with exact python outputs."
    )

    # Warning alert box for LLM context limitations
    st.info(
        "💡 **Context Limitation Insight**\n\n"
        "The full dataset consists of **2,490,620 rows**. Feeding this directly to an LLM context window is impossible "
        "since it exceeds the context token limit (GPT-4o can digest ~1,600 to 2,560 rows directly, covering less than **0.1%**). "
        "Therefore, pre-aggregation or RAG architecture is required for production analytics."
    )

    # GPT evaluation statistics
    ec1, ec2, ec3 = st.columns(3)
    ec1.metric("Evaluation Accuracy", "80%", "4 / 5 Prompts Correct")
    ec2.metric("Average Response Latency", "1.86s", "Seconds per Prompt")
    ec3.metric("Total Tokens Consumed", "5,909", "Across 5 tests")

    st.subheader("Prompts & Ground Truth Comparative Log")

    eval_data = [
        {
            "id": 1,
            "q": "Which store generated the highest total sales revenue in 2025?",
            "gt": "HY-VEE #3 / BDI / DES MOINES ($13,668,737.03)",
            "gpt": "The store that generated the highest total sales revenue in 2025 was 'HY-VEE #3 / BDI / DES MOINES' with $13,668,737.03.",
            "status": "Correct (Validated)",
            "meta": "Latency: 2.53s | Tokens: 1165"
        },
        {
            "id": 2,
            "q": "Which product had the highest total sales revenue in 2025?",
            "gt": "TITOS HANDMADE VODKA ($29,952,776.16)",
            "gpt": "The product with the highest total sales revenue in 2025 was 'TITOS HANDMADE VODKA,' with sales amounting to $29,952,776.16.",
            "status": "Correct (Validated)",
            "meta": "Latency: 1.49s | Tokens: 1163"
        },
        {
            "id": 3,
            "q": "What was the monthly sales revenue trend throughout 2025? Did sales increase or decrease overall?",
            "gt": "Increased overall. Jan: $31,111,677.66 -> Dec: $41,662,102.00 (+33.9%)",
            "gpt": "The monthly sales revenue trend throughout 2025 showed a general increase. Starting from $31,111,677.66 in January, sales gradually increased, peaking in December at $41,662,102.00. There were fluctuations, with notable increases in April ($35,499,986.35), October ($40,047,135.70), and December, indicating a general upward trend over the year.",
            "status": "Correct (Validated)",
            "meta": "Latency: 2.68s | Tokens: 1217"
        },
        {
            "id": 4,
            "q": "Which county had the lowest sales revenue among the top 10 counties?",
            "gt": "CLINTON ($10,718,074.08)",
            "gpt": "Clinton County had the lowest sales revenue among the top 10 counties, with $10,718,074.08.",
            "status": "Correct (Validated)",
            "meta": "Latency: 0.74s | Tokens: 1152"
        },
        {
            "id": 5,
            "q": "Based on the monthly sales data, identify any anomalies or unusual spikes in revenue during 2025.",
            "gt": "December 2025: $41,662,102.00 (deviation from mean: $6,259,245.07)",
            "gpt": "In 2025, there are two notable spikes in monthly sales revenue. October and December show significantly higher sales compared to other months. October's sales revenue is $40,047,135.70, and December's is even higher at $41,662,102.00. These figures are considerably above the average monthly sales, which generally range between $31 million and $36 million.",
            "status": "Semantically Mismatched",
            "meta": "Latency: 1.87s | Tokens: 1212"
        }
    ]

    for item in eval_data:
        with st.expander(f"Q{item['id']}: {item['q']}"):
            st.markdown(f"**Result Status:** :blue[{item['status']}]" if "Mismatched" in item['status'] else f"**Result Status:** :green[{item['status']}]")
            
            c1, c2 = st.columns(2)
            with c1:
                st.markdown("**Ground Truth (Pandas)**")
                st.info(item['gt'])
            with c2:
                st.markdown("**GPT-4o Response**")
                if "Mismatched" in item['status']:
                    st.warning(item['gpt'])
                else:
                    st.success(item['gpt'])
            
            st.caption(item['meta'])

# ==========================================
# PAGE 3: SALES FORECASTING
# ==========================================
elif nav_page == "Sales Forecasting":
    st.title("📈 2026 Sales Forecasting Playground")
    st.markdown(
        "Tweak the intercept and trend parameters of the Linear Regression model to see how it reshapes the 2026 forecast predictions."
    )

    # Default parameters from python run
    baseline_slope = 651904.0
    baseline_intercept = 31165478.0

    f_col1, f_col2 = st.columns([1.7, 1], gap="large")

    # Put sliders first so slope/intercept exist before chart uses them
    with f_col2:
        st.subheader("Interactive Parameters")

        slope = st.slider(
            "Monthly Growth Trend (Slope)",
            min_value=0.0,
            max_value=2000000.0,
            value=baseline_slope,
            step=10000.0
        )

        intercept = st.slider(
            "Baseline Intercept (Dec 25 Index)",
            min_value=20000000.0,
            max_value=40000000.0,
            value=baseline_intercept,
            step=50000.0
        )

        st.divider()

        june_prediction = intercept + 18 * slope

        st.metric("Predicted June 2026 Revenue", fmt_curr(june_prediction))
        st.metric("Linear Baseline R² Score", "0.5942")

        if st.button("Reset parameters to Baseline"):
            st.rerun()

    with f_col1:
        st.subheader("2025 Actuals vs. 2026 Forecast")

        df_monthly = (
            df.groupby(df['ordered_on'].dt.to_period('M'))['sales_dollars']
            .sum()
            .reset_index()
        )

        df_monthly.columns = ['month', 'sales_dollars']
        df_monthly['month'] = df_monthly['month'].dt.to_timestamp()
        df_monthly = df_monthly.sort_values('month')

        actual_df = pd.DataFrame({
            "Month": df_monthly['month'].dt.strftime('%b %Y'),
            "Revenue": df_monthly['sales_dollars'],
            "Series": "2025 Actuals"
        })

        dec_2025_value = df_monthly.loc[
            df_monthly['month'] == pd.Timestamp("2025-12-01"),
            'sales_dollars'
        ].values[0]

        forecast_months = pd.date_range(
            start="2025-12-01",
            end="2026-06-01",
            freq="MS"
        )

        forecast_values = [dec_2025_value] + [
            intercept + m * slope for m in range(13, 19)
        ]

        forecast_df = pd.DataFrame({
            "Month": forecast_months.strftime('%b %Y'),
            "Revenue": forecast_values,
            "Series": "2026 Forecast"
        })

        plot_df = pd.concat([actual_df, forecast_df], ignore_index=True)

        month_order = (
            list(pd.date_range("2025-01-01", "2025-12-01", freq="MS").strftime('%b %Y'))
            + list(pd.date_range("2026-01-01", "2026-06-01", freq="MS").strftime('%b %Y'))
        )

        chart = (
            alt.Chart(plot_df)
            .mark_line(point=True)
            .encode(
                x=alt.X(
                    "Month:N",
                    sort=month_order,
                    title="Month",
                    axis=alt.Axis(labelAngle=0)
                ),
                y=alt.Y(
                    "Revenue:Q",
                    title="Revenue ($)",
                    axis=alt.Axis(format="$,.0f")
                ),
                color=alt.Color("Series:N", title="Series"),
                tooltip=[
                    alt.Tooltip("Series:N", title="Series"),
                    alt.Tooltip("Month:N", title="Month"),
                    alt.Tooltip("Revenue:Q", title="Revenue", format="$,.2f")
                ]
            )
            .properties(height=430)
        )

        st.altair_chart(chart, use_container_width=True)

# ==========================================
# PAGE 4: RAG CHAT ASSISTANT
# ==========================================
elif nav_page == "RAG Chat Assistant":
    st.title("💬 RAG Sales Assistant")
    st.markdown(
        "Ask questions about the 2025 Iowa Liquor Sales dataset. The assistant demonstrates how pre-aggregated RAG documents solve LLM token limits."
    )

    if st.button("Clear Chat"):
        st.session_state.messages = [
            {
                "role": "assistant",
                "content": "Hello! I am your Iowa Liquor Sales assistant. I have access to the pre-aggregated 2025 dataset metrics. Ask me a question about stores, products, counties, or the monthly sales trend.",
                "citation": None
            }
        ]
        st.rerun()

    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {
                "role": "assistant",
                "content": "Hello! I am your Iowa Liquor Sales assistant. I have access to the pre-aggregated 2025 dataset metrics. Ask me a question about stores, products, counties, or the monthly sales trend.",
                "citation": None
            }
        ]

    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if message.get("citation"):
                st.caption(f"**Retrieved RAG Node:** {message['citation']}")

    # RAG QA logic matches
   # Real GPT-4o backend call using the full cached dataset
    def get_rag_reply(query):
        return ask_gpt4o(query, df)

    # Accept user prompt
    if prompt := st.chat_input("Ask a question about 2025 sales..."):
        # Append user message
        st.session_state.messages.append({"role": "user", "content": prompt, "citation": None})
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Get response
        reply = get_rag_reply(prompt)
        
        # Append bot message
        st.session_state.messages.append({
            "role": "assistant",
            "content": reply["text"],
            "citation": reply["citation"]
        })
        
        with st.chat_message("assistant"):
            st.markdown(reply["text"])
            st.caption(f"**Retrieved RAG Node:** {reply['citation']}")

# ==========================================
# PAGE 5: CUSTOM CSV UPLOAD
# ==========================================
elif nav_page == "Custom CSV Upload":
    st.title("📁 Upload Custom Sales Dataset")
    st.markdown(
        "Upload a smaller subset CSV of sales transactions to perform metrics calculations dynamically."
    )

    custom_file = st.file_uploader(
        "Choose a CSV file",
        type="csv",
        help="Make sure the CSV contains 'store_name' and 'sales_dollars' columns."
    )

    if custom_file is not None:
        try:
            custom_df = pd.read_csv(custom_file)

            if 'store_name' in custom_df.columns and 'sales_dollars' in custom_df.columns:
                st.success("CSV file loaded successfully!")

                # Clean numeric column
                custom_df['sales_dollars'] = pd.to_numeric(custom_df['sales_dollars'], errors='coerce')
                custom_df = custom_df.dropna(subset=['sales_dollars'])

                # Metrics
                col_row, col_sales = st.columns(2)
                col_row.metric("Total Rows", f"{custom_df.shape[0]:,}")

                total_rev = custom_df['sales_dollars'].sum()
                col_sales.metric("Total Sales Revenue", fmt_curr(total_rev))

                # Dynamic top stores
                st.subheader("Top 3 Stores by Sales Revenue")
                top3 = (
                    custom_df.groupby('store_name')['sales_dollars'].sum()
                    .sort_values(ascending=False)
                    .head(3)
                )

                for idx, (name, val) in enumerate(top3.items()):
                    st.write(f"{idx+1}. **{name}**: {fmt_curr(val)}")

                # GPT-4o integration for uploaded CSV
                st.divider()
                st.subheader("Ask GPT-4o About Uploaded CSV")

                custom_question = st.text_input(
                    "Ask a question about your uploaded CSV",
                    placeholder="Example: Which store has the highest sales in this uploaded file?"
                )

                if st.button("Ask GPT-4o About Uploaded CSV"):
                    if not custom_question.strip():
                        st.warning("Please enter a question.")
                    else:
                        with st.spinner("GPT-4o is analyzing the uploaded file summary..."):
                            custom_reply = ask_gpt4o(custom_question, custom_df)

                        st.markdown("### GPT-4o Response")
                        st.write(custom_reply["text"])
                        st.caption(f"**Retrieved Context:** {custom_reply['citation']}")

            else:
                st.error("Missing columns. Ensure your CSV contains 'store_name' and 'sales_dollars' columns.")

        except Exception as e:
            st.error(f"Error parsing file: {e}")
