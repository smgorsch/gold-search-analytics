import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Papa from 'papaparse';
import _ from 'lodash';

const GoldSearchDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await window.fs.readFile('gold_search_data.csv', { encoding: 'utf8' });
        Papa.parse(response, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const processedData = processSearchData(results.data);
            setData(processedData);
            setLoading(false);
          },
          error: (error) => {
            setError('Error parsing data: ' + error.message);
            setLoading(false);
          }
        });
      } catch (error) {
        setError('Error loading data: ' + error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processSearchData = (rawData) => {
    // Sort data by date
    const sortedData = _.sortBy(rawData, 'date');
    
    // Calculate 7-day rolling averages
    const rollingData = sortedData.map((entry, index) => {
      const windowStart = Math.max(0, index - 6);
      const window = sortedData.slice(windowStart, index + 1);
      const sum = _.sumBy(window, 'searchCount');
      
      // Calculate previous period data
      const prevWindowStart = Math.max(0, windowStart - 7);
      const prevWindow = sortedData.slice(prevWindowStart, windowStart);
      const prevSum = prevWindow.length === 7 ? _.sumBy(prevWindow, 'searchCount') : null;

      return {
        date: entry.date,
        currentPeriod: sum,
        previousPeriod: prevSum
      };
    });

    return rollingData;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gold Search Trends Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="currentPeriod" 
                stroke="#8884d8" 
                name="Current Period"
              />
              <Line 
                type="monotone" 
                dataKey="previousPeriod" 
                stroke="#82ca9d" 
                name="Previous Period" 
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoldSearchDashboard;