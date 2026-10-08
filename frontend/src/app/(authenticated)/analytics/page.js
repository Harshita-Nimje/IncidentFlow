"use client";

import { useEffect, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";

export default function AnalyticsPage() {
    const [severityData, setSeverityData] = useState([]);
    const colors = ["#ef4444", "#f97316", "#eab308", "#3b82f6"]
    const [trendData, setTrendData] = useState([]);
    const [stats, setStats] = useState({
        total_incidents: 0,
        active_incidents: 0,
        resolved_incidents: 0,
        average_resolution_hours: 0
    });
    const [serviceData, setServiceData] = useState([]);


    useEffect(() => {
        const fetchSeverityData = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/incidents-by-severity`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();


                setSeverityData(data.data || []);

            } catch (error) {
                console.error("Error fetching severity analytics:", error);
            }
        };

        const fetchStats = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/stats`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();

                setStats(data.data || {});

            } catch (error) {
                console.error("Error fetching incident stats:", error);
            }
        };

        const fetchTrendData = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/incident-trends`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();


                setTrendData(data.data || []);

            } catch (error) {
                console.error("Error fetching incident trends:", error);
            }
        };

        const fetchServiceData = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/incidents-by-service`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();

                setServiceData(data.data || []);

            } catch (error) {
                console.error("Error fetching incidents by service:", error);
            }
        };

        fetchSeverityData();
        fetchStats();
        fetchTrendData();
        fetchServiceData();
    }, []);
    const formattedTrendData = [
        {
            id: "Incidents",
            data: trendData
                .filter(
                    (item) =>
                        item.date &&
                        item.count !== null &&
                        item.count !== undefined &&
                        !Number.isNaN(Number(item.count))
                )
                .map((item) => ({
                    x: new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                    }),
                    y: Number(item.count)
                }))
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">
                    Incident Analytics
                </h1>

                <p className="text-slate-400 mb-8">
                    Overview of incidents by severity
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <p className="text-slate-400 text-sm">
                            Total Incidents
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {stats.total_incidents}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <p className="text-slate-400 text-sm">
                            Active Incidents
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {stats.active_incidents}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <p className="text-slate-400 text-sm">
                            Resolved Incidents
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {stats.resolved_incidents}
                        </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <p className="text-slate-400 text-sm">
                            Average Resolution Time
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {stats.average_resolution_hours} hrs
                        </p>
                    </div>

                </div>



                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                    <h2 className="text-xl font-semibold mb-6">
                        Incidents by Severity
                    </h2>

                    <div className="w-full h-[200px]">
                        <div className="space-y-5 pt-4">
                            {severityData.map((item) => {
                                const count = Number(item.count);

                                const maxCount = Math.max(
                                    ...severityData.map((item) => Number(item.count))
                                );

                                const percentage = (count / maxCount) * 100;

                                return (
                                    <div key={item.severity}>
                                        <div className="flex items-center gap-4">

                                            {/* Severity */}
                                            <div className="w-16 shrink-0 font-semibold text-white">
                                                {item.severity}
                                            </div>

                                            {/* Progress bar */}
                                            <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor:
                                                            item.severity === "SEV-1"
                                                                ? "#ef4444"
                                                                : item.severity === "SEV-2"
                                                                    ? "#f97316"
                                                                    : item.severity === "SEV-3"
                                                                        ? "#eab308"
                                                                        : "#3b82f6"
                                                    }}
                                                />
                                            </div>

                                            {/* Count */}
                                            <div className="w-28 shrink-0 text-right text-sm text-slate-300">
                                                {count} {count === 1 ? "incident" : "incidents"}
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>

                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-8">

                    <h2 className="text-xl font-semibold mb-6">
                        Incident Trends
                    </h2>

                    <div className="w-full h-[400px]">
                        {formattedTrendData[0].data.length > 0 ? (
                            <ResponsiveLine
                                data={formattedTrendData}
                                margin={{
                                    top: 30,
                                    right: 30,
                                    bottom: 60,
                                    left: 60
                                }}
                                xScale={{
                                    type: "point"
                                }}
                                yScale={{
                                    type: "linear",
                                    min: 0,
                                    max: "auto",
                                    stacked: false
                                }}
                                curve="linear"
                                axisBottom={{
                                    tickRotation: 0,
                                    legend: "Dates",
                                    legendOffset: 45,
                                    legendPosition: "middle"
                                }}
                                axisLeft={{
                                    tickValues: 5,
                                    legend: "Incidents",
                                    legendOffset: -50,
                                    legendPosition: "middle"
                                }}
                                enableGridX={false}
                                enableArea={true}
                                areaOpacity={0.08}
                                enablePoints={true}
                                pointSize={7}
                                pointBorderWidth={2}
                                useMesh={true}
                                enableCrosshair={true}
                                colors={["#3b82f6"]}
                                tooltip={({ point }) => (
                                    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm">
                                        {point.data.yFormatted} incidents
                                    </div>
                                )}
                                theme={{
                                    text: {
                                        fill: "#cbd5e1"
                                    },
                                    axis: {
                                        ticks: {
                                            text: {
                                                fill: "#94a3b8"
                                            }
                                        },
                                        legend: {
                                            text: {
                                                fill: "#cbd5e1"
                                            }
                                        }
                                    },
                                    grid: {
                                        line: {
                                            stroke: "#1e293b"
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                No incident trend data available
                            </div>
                        )}
                    </div>

                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-white">
                            Incidents by Service
                        </h2>

                        <p className="text-sm text-slate-400 mt-1">
                            Number of incidents reported for each service
                        </p>
                    </div>

                    <div className="w-full h-[400px]">
                        <ResponsiveBar
                            data={serviceData}
                            keys={["count"]}
                            indexBy="service_name"
                            layout="horizontal"
                            margin={{
                                top: 20,
                                right: 30,
                                bottom: 50,
                                left: 140
                            }}
                            padding={0.3}
                            valueScale={{
                                type: "linear"
                            }}
                            indexScale={{
                                type: "band",
                                round: true
                            }}
                            colors={["#0c2e66ff"]}
                            borderRadius={6}
                            enableLabel={true}
                            labelTextColor="#ffffff"
                            axisBottom={{
                                tickValues: 5,
                                legend: "Incidents",
                                legendPosition: "middle",
                                legendOffset: 40
                            }}
                            axisLeft={{
                                tickRotation: 0,
                                legend: "Service",
                                legendPosition: "middle",
                                legendOffset: -120
                            }}
                            enableGridX={true}
                            enableGridY={false}
                            theme={{
                                text: {
                                    fill: "#cbd5e1"
                                },
                                axis: {
                                    ticks: {
                                        text: {
                                            fill: "#94a3b8"
                                        }
                                    },
                                    legend: {
                                        text: {
                                            fill: "#cbd5e1"
                                        }
                                    }
                                },
                                grid: {
                                    line: {
                                        stroke: "#1e293b"
                                    }
                                },
                                tooltip: {
                                    container: {
                                        background: "#0f172a",
                                        color: "#ffffff",
                                        borderRadius: "8px"
                                    }
                                }
                            }}
                            tooltip={({ indexValue, value }) => (
                                <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm">
                                    {value} incidents
                                </div>
                            )}
                        />
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-white">
                            Incidents by Service
                        </h2>

                        <p className="text-sm text-slate-400 mt-1">
                            Number of incidents reported for each service
                        </p>
                    </div>

                    <div className="space-y-4">
                        {serviceData.map((item) => (
                            <div
                                key={item.service_name}
                                className="flex items-center justify-between bg-slate-800/50 rounded-xl px-5 py-4"
                            >
                                <span className="text-white font-medium">
                                    {item.service_name}
                                </span>

                                <span className="text-2xl font-bold text-blue-400">
                                    {Number(item.count)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
