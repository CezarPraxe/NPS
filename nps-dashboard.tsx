import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import _ from 'lodash';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedSatisfaction, setSelectedSatisfaction] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await window.fs.readFile('NPS interno (respostas) - Respostas ao formulário 1.csv', { encoding: 'utf8' });
        const result = Papa.parse(response, {
          header: true,
          skipEmptyLines: true
        });
        setData(result.data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Carregando dados...</p>
      </div>
    );
  }

  const filteredData = data.filter(row => {
    if (selectedEmployee !== 'all' && row['Nome\n'] !== selectedEmployee) return false;
    if (selectedSatisfaction !== 'all' && row['Quão satisfeito você está na função que exerce hoje? '] !== selectedSatisfaction) return false;
    return true;
  });

  // Prepare data for satisfaction distribution
  const satisfactionData = _.countBy(filteredData, 'Quão satisfeito você está na função que exerce hoje? ');
  const satisfactionChartData = Object.entries(satisfactionData).map(([level, count]) => ({
    satisfaction: `Nível ${level}`,
    count
  }));

  // Prepare data for sector change interest
  const sectorChangeData = _.countBy(filteredData, 'Você tem interesse em mudar de setor? ');
  const sectorChangePieData = Object.entries(sectorChangeData).map(([answer, count]) => ({
    name: answer,
    value: count
  }));

  // Prepare data for preferred sectors
  const preferredSectorsData = filteredData
    .filter(row => row['Se tem interesse em mudar de Setor. Para qual setor você gostaria de ir?'])
    .reduce((acc, row) => {
      const sectors = row['Se tem interesse em mudar de Setor. Para qual setor você gostaria de ir?'].split(', ');
      sectors.forEach(sector => {
        acc[sector] = (acc[sector] || 0) + 1;
      });
      return acc;
    }, {});

  const preferredSectorsChartData = Object.entries(preferredSectorsData).map(([sector, count]) => ({
    sector,
    count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard de NPS Interno</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            value={selectedEmployee}
            onValueChange={setSelectedEmployee}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um colaborador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os colaboradores</SelectItem>
              {_.uniqBy(data, 'Nome\n').map(row => (
                <SelectItem key={row['Nome\n']} value={row['Nome\n']}>
                  {row['Nome\n']}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedSatisfaction}
            onValueChange={setSelectedSatisfaction}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por nível de satisfação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              {[1, 2, 3, 4, 5].map(level => (
                <SelectItem key={level} value={String(level)}>
                  Nível {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Satisfaction Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Satisfação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={satisfactionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="satisfaction" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sector Change Interest */}
        <Card>
          <CardHeader>
            <CardTitle>Interesse em Mudança de Setor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorChangePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sectorChangePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Preferred Sectors */}
        <Card>
          <CardHeader>
            <CardTitle>Setores Preferidos para Mudança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={preferredSectorsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Feedback Panel */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Feedbacks Detalhados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto space-y-6">
              {filteredData.map((row, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-lg">{row['Nome\n']}</h3>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      Satisfação: {row['Quão satisfeito você está na função que exerce hoje? ']}/5
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Motivo da Satisfação/Insatisfação:</h4>
                    <p className="text-gray-600 bg-white p-3 rounded">
                      {row['Qual o principal motivo da sua satisfação ou insatisfação com a função atual? ']}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Aprendizados na Função:</h4>
                    <p className="text-gray-600 bg-white p-3 rounded">
                      {row['O que você mais aprendeu ao desempenhar essa função? Sente que ainda há algo a mais para aprender? ']}
                    </p>
                  </div>

                  {row['Alguma função específica que gostaria de realizar nessa mudança de setor ou até mesmo dentro do seu próprio setor?'] && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Interesses de Mudança/Desenvolvimento:</h4>
                      <p className="text-gray-600 bg-white p-3 rounded">
                        {row['Alguma função específica que gostaria de realizar nessa mudança de setor ou até mesmo dentro do seu próprio setor?']}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                      Tempo na função: {row['Há quanto tempo você está na função atual? ']}
                    </span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                      Interesse em mudança: {row['Você tem interesse em mudar de setor? ']}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;