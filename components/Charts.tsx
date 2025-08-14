import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Department, Submission, EmploymentType, AcademicRank, StaffCount } from '../types';
import { ACADEMIC_RANKS, EMPLOYMENT_TYPES } from '../constants';

interface StaffDistributionChartProps {
    submissions: Submission[];
    departments: Department[];
}

export const StaffDistributionChart: React.FC<StaffDistributionChartProps> = ({ submissions, departments }) => {
    const data = departments.map(dept => {
        const submission = submissions.find(s => s.departmentId === dept.id);
        const totalStaff = submission ? Object.values(submission.data).reduce((acc: number, rankData) => {
            return acc + Object.values(rankData as StaffCount).reduce((sum: number, count: number) => sum + (count || 0), 0);
        }, 0) : 0;
        return { name: dept.name, 'Total Staff': totalStaff };
    });

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} style={{ fontSize: '12px' }} />
                <YAxis allowDecimals={false}/>
                <Tooltip />
                <Legend />
                <Bar dataKey="Total Staff" fill="#1d4ed8" />
            </BarChart>
        </ResponsiveContainer>
    );
};

interface EmploymentTypePieChartProps {
    submissions: Submission[];
}

export const EmploymentTypePieChart: React.FC<EmploymentTypePieChartProps> = ({ submissions }) => {
    const data = submissions.reduce((acc, submission) => {
        Object.values(submission.data).forEach(rankData => {
            Object.entries(rankData as StaffCount).forEach(([type, count]) => {
                const employmentType = type as EmploymentType;
                acc[employmentType] = (acc[employmentType] || 0) + (count || 0);
            });
        });
        return acc;
    }, {} as { [key in EmploymentType]?: number });

    const pieData = EMPLOYMENT_TYPES.map(type => ({
        name: type,
        value: data[type] || 0,
    })).filter(d => d.value > 0);

    const COLORS = ['#1d4ed8', '#3b82f6', '#93c5fd'];

    return (
        <ResponsiveContainer width="100%" height={400}>
            <PieChart>
                <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};