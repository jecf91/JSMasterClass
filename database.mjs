import Parser from './parser.mjs';
import DatabaseError from './error.mjs';

export default class Database {
  constructor(){
    this.tables = {};
    this.parser = new Parser();
  }

  createTable(parsedStatement){
    let [,tableName,columns] = parsedStatement;
    this.tables[tableName] = {
      columns: {},
      data: [],
    }
    columns = columns.split(",")
    for (let column of columns) {
      column = column.trim().split(" ");
      const name = column[0];
      const type = column[1];
      this.tables[tableName].columns[name] = type;
    }
  }

  insert(parsedStatement){
    let [,tableName, columns, values] = parsedStatement;
    columns = columns.split(", ");
    values = values.split(", ");
    let row = {};
    for(let i = 0; i < columns.length; i++){
      const column = columns[i];
      const value = values[i];
      row[column] = value;
    }
    this.tables[tableName].data.push(row);
  }

  select(parsedStatement){
    let [,columns, tableName, whereClause] = parsedStatement;
    columns = columns.split(", "); 
    let rows = this.tables[tableName].data;

    if(whereClause){
      const [columnWhere, valueWhere] = whereClause.split(" = ");
      rows = rows.filter(function(row) {
        return row[columnWhere] === valueWhere;
      })
    }

    rows = rows.map(function(row) {
      let selectedRow = {}
      for(let column of columns){
        selectedRow[column] = row[column]
      }
      return selectedRow;
    });

    return rows;  
  }

  delete(parsedStatement){
    let [, tableName, whereClause] = parsedStatement
    let [columnWhere, valueWhere] = whereClause.split(" = ");
    if(whereClause){
      let rows = this.tables[tableName].data;
      rows = rows.filter(function(row){
        return row[columnWhere] !== valueWhere;
      })
      return rows;
    } else {
      this.tables[tableName].data = [];
    }
    
  }

  execute(statement){
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        const result = this.parser.parse(statement);
        if(result) {
          resolve(this[result.command](result.parsedStatement));
        }
        
        const message = `Syntax Error: "${statement}"`;
        reject(new DatabaseError(statement, message));
      },1000)
    });
  }

};
 