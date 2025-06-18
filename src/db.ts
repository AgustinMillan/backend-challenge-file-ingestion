import sql from "mssql";

const config: sql.config = {
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  server: process.env.SQLSERVER_HOST || "localhost",
  database: process.env.SQLSERVER_DATABASE,
  options: {
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool;

async function connectWithRetry(retries = 5, delay = 6000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Intentando conectar a SQL Server (intento ${i + 1})...`);

      // Primero intentamos conectar sin especificar la base de datos
      const tempConfig = {
        ...config,
        database: "master", // Conectamos a la base de datos maestra
      };

      pool = await sql.connect(tempConfig);
      console.log("Conexión exitosa a master");

      // Verificamos si la base de datos existe
      const dbCheck = await pool
        .request()
        .query(
          `SELECT name FROM sys.databases WHERE name = '${config.database}'`
        );

      if (dbCheck.recordset.length === 0) {
        // Si no existe, la creamos
        console.log(`Creando base de datos ${config.database}...`);
        await pool.request().query(`CREATE DATABASE ${config.database}`);
        console.log(`Base de datos ${config.database} creada exitosamente`);
      }

      // Ahora nos conectamos a la base de datos específica
      await pool.close();
      pool = await sql.connect(config);

      // Verificamos si la tabla existe
      const tableCheck = await pool
        .request()
        .query(
          `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Clientes'`
        );

      if (tableCheck.recordset.length === 0) {
        // Si no existe, ejecutamos el script SQL para crearla
        console.log("Creando tabla Clientes...");
        await pool.request().batch(`
          CREATE TABLE Clientes (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            NombreCompleto NVARCHAR(100) NOT NULL,
            DNI BIGINT NOT NULL,
            Estado VARCHAR(10) NOT NULL,
            FechaIngreso DATE NOT NULL,
            EsPEP BIT NOT NULL,
            EsSujetoObligado BIT NULL,
            FechaCreacion DATETIME NOT NULL
          )
        `);
        console.log("Tabla Clientes creada exitosamente");
      }

      return pool;
    } catch (err: any) {
      console.error(`Error al conectar: ${err.message}`);
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
}

export async function connect() {
  if (!pool) {
    await connectWithRetry();
  }
  return pool;
}

export async function insertClientes(clientes: any[]): Promise<void> {
  if (!pool || !pool.connected) {
    await connect();
  }

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    const table = new sql.Table("Clientes");
    table.create = false;
    table.columns.add("NombreCompleto", sql.NVarChar(100), { nullable: false });
    table.columns.add("DNI", sql.BigInt, { nullable: false });
    table.columns.add("Estado", sql.VarChar(10), { nullable: false });
    table.columns.add("FechaIngreso", sql.Date, { nullable: false });
    table.columns.add("EsPEP", sql.Bit, { nullable: false });
    table.columns.add("EsSujetoObligado", sql.Bit, { nullable: true });
    table.columns.add("FechaCreacion", sql.DateTime, { nullable: false });

    clientes.forEach((c) => {
      table.rows.add(
        c.nombreCompleto,
        c.dni,
        c.estado,
        c.fechaIngreso,
        c.esPep,
        c.esSujetoObligado,
        c.fechaCreacion
      );
    });

    await request.bulk(table);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("Error en insertClientes:", error);
    throw error;
  }
}

export async function validateDb() {
  try {
    if (!pool || !pool.connected) {
      await connect();
    }
    await pool.request().query("SELECT 1");
  } catch (error) {
    throw error;
  }
}
