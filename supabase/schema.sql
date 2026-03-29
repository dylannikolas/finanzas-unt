-- ============================================================
-- FinanzasUNT — Schema completo para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. WALLET — Saldos por método de pago
CREATE TABLE wallet (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metodo      VARCHAR(20) NOT NULL CHECK (metodo IN ('efectivo','yape','tarjeta')),
  saldo       DECIMAL(10,2) DEFAULT 0 NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet: solo el dueño" ON wallet FOR ALL USING (auth.uid() = user_id);

-- 2. TRANSACCION — Ingresos y egresos del día a día
CREATE TABLE transaccion (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fecha       DATE NOT NULL,
  monto       DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  metodo      VARCHAR(20) NOT NULL CHECK (metodo IN ('efectivo','yape','tarjeta')),
  categoria   VARCHAR(50) NOT NULL,
  tipo        VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  descripcion TEXT,
  recurrente  VARCHAR(10) DEFAULT 'no' CHECK (recurrente IN ('no','mensual','semanal')),
  deleted_at  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE transaccion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transaccion: solo el dueño" ON transaccion FOR ALL USING (auth.uid() = user_id);

-- Índices para consultas frecuentes
CREATE INDEX idx_transaccion_fecha ON transaccion(user_id, fecha DESC);
CREATE INDEX idx_transaccion_tipo  ON transaccion(user_id, tipo);

-- 3. PRESTAMO — Módulo de deudas
CREATE TABLE prestamo (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  persona        VARCHAR(100) NOT NULL,
  direccion      VARCHAR(10) NOT NULL CHECK (direccion IN ('dado','recibido')),
  monto_inicial  DECIMAL(10,2) NOT NULL CHECK (monto_inicial > 0),
  monto_abonado  DECIMAL(10,2) DEFAULT 0 NOT NULL,
  metodo         VARCHAR(20) NOT NULL CHECK (metodo IN ('efectivo','yape','tarjeta')),
  fecha          DATE NOT NULL,
  fecha_limite   DATE,
  descripcion    TEXT,
  estado         VARCHAR(10) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','parcial','saldado')),
  deleted_at     TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE prestamo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prestamo: solo el dueño" ON prestamo FOR ALL USING (auth.uid() = user_id);

-- 4. ABONO — Pagos parciales de préstamos
CREATE TABLE abono (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prestamo_id  UUID REFERENCES prestamo(id) ON DELETE CASCADE NOT NULL,
  monto        DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  fecha        DATE NOT NULL,
  descripcion  TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE abono ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abono: solo el dueño" ON abono FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN: Actualizar saldo de wallet automáticamente
-- Se ejecuta cada vez que se inserta una transacción
-- ============================================================
CREATE OR REPLACE FUNCTION actualizar_saldo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'ingreso' THEN
    UPDATE wallet SET saldo = saldo + NEW.monto, updated_at = now()
    WHERE user_id = NEW.user_id AND metodo = NEW.metodo;
  ELSIF NEW.tipo = 'egreso' THEN
    UPDATE wallet SET saldo = saldo - NEW.monto, updated_at = now()
    WHERE user_id = NEW.user_id AND metodo = NEW.metodo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_actualizar_saldo
AFTER INSERT ON transaccion
FOR EACH ROW EXECUTE FUNCTION actualizar_saldo();

-- ============================================================
-- FUNCIÓN: Actualizar monto_abonado y estado del préstamo
-- Se ejecuta cada vez que se registra un abono
-- ============================================================
CREATE OR REPLACE FUNCTION actualizar_prestamo_abono()
RETURNS TRIGGER AS $$
DECLARE
  v_monto_inicial DECIMAL;
  v_nuevo_abonado DECIMAL;
BEGIN
  SELECT monto_inicial, monto_abonado + NEW.monto
  INTO v_monto_inicial, v_nuevo_abonado
  FROM prestamo WHERE id = NEW.prestamo_id;

  UPDATE prestamo SET
    monto_abonado = v_nuevo_abonado,
    estado = CASE
      WHEN v_nuevo_abonado >= v_monto_inicial THEN 'saldado'
      WHEN v_nuevo_abonado > 0               THEN 'parcial'
      ELSE 'pendiente'
    END
  WHERE id = NEW.prestamo_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_actualizar_abono
AFTER INSERT ON abono
FOR EACH ROW EXECUTE FUNCTION actualizar_prestamo_abono();

-- ============================================================
-- DATOS INICIALES: Crear wallets para nuevo usuario
-- Se ejecuta automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION crear_wallets_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallet (user_id, metodo, saldo) VALUES
    (NEW.id, 'efectivo', 0),
    (NEW.id, 'yape', 0),
    (NEW.id, 'tarjeta', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_crear_wallets
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION crear_wallets_usuario();
