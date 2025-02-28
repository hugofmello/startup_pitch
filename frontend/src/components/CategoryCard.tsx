import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { Category } from '../types';

interface CategoryCardProps {
  category: any;
}

// Função para determinar a cor do chip com base na nota (grade) da categoria
const getCategoryGradeColor = (grade: string): string => {
  if (!grade) return '#9e9e9e'; // Cinza para undefined
  
  const gradeMap: Record<string, string> = {
    'A+': '#00c853', // Verde escuro
    'A': '#00e676', // Verde médio
    'A-': '#69f0ae', // Verde claro
    'B+': '#2196f3', // Azul
    'B': '#64b5f6', // Azul médio
    'B-': '#90caf9', // Azul claro
    'C+': '#ffeb3b', // Amarelo
    'C': '#fff176', // Amarelo médio
    'C-': '#fff9c4', // Amarelo claro
    'D+': '#ff9800', // Laranja
    'D': '#ffb74d', // Laranja médio
    'D-': '#ffe0b2', // Laranja claro
    'F': '#f44336', // Vermelho
  };
  
  return gradeMap[grade] || '#9e9e9e';
};

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const categoryName = category['category-name'] || 'Categoria sem nome';
  const categoryGrade = category['category-grade'] || 'N/A';
  const insights = category.insights || [];
  
  const gradeColor = getCategoryGradeColor(categoryGrade);
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            {categoryName}
          </Typography>
          <Chip 
            label={categoryGrade} 
            sx={{ 
              backgroundColor: gradeColor, 
              color: '#fff', 
              fontWeight: 'bold',
              minWidth: '40px'
            }} 
          />
        </Box>
        
        {insights.length > 0 ? (
          <List>
            {insights.map((insight: string, index: number) => (
              <ListItem key={index} alignItems="flex-start" sx={{ pl: 0, pr: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LightbulbIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={insight}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Nenhum insight disponível para esta categoria.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
