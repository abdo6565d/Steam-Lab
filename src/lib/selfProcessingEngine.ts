import { 
  POPULAR_COMPONENTS, 
  CustomConnection, 
  ConnectionMode, 
  WireSuggestion, 
  CircuitResult, 
  ResistorItem, 
  SavedProject,
  ComponentSequentialGuide,
  SequentialWiringStep
} from '../constants';

// Hardware Pinout Definitions and Capabilities
const DIGITAL_PINS = ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'];
const PWM_PINS = ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'];
const ANALOG_PINS = ['A0', 'A1', 'A2', 'A3'];

interface ComponentPinRequirement {
  id: string;
  name: string;
  pins: Array<{
    pinName: string;
    preferredArduinoPin: string;
    pinType: 'digital' | 'pwm' | 'analog' | 'i2c_sda' | 'i2c_scl' | 'power_5v' | 'power_3v3' | 'gnd';
    breadboardCol: number;
    breadboardRow: string;
    note?: string;
  }>;
  requiresPullUp?: { resistorVal: string; targetPin: string; reason: string };
  requiresSeriesResistor?: { resistorVal: string; targetPin: string; reason: string };
  libraries?: string[];
  globalCode?: (pins: Record<string, string>) => string;
  setupCode?: (pins: Record<string, string>) => string[];
  loopReadCode?: (pins: Record<string, string>) => string[];
  loopActionCode?: (pins: Record<string, string>, condition: string) => string[];
}

export const COMPONENT_RULES: Record<string, ComponentPinRequirement> = {
  'ds18b20': {
    id: 'ds18b20',
    name: 'DS18B20 Temp Sensor',
    pins: [
      { pinName: 'VCC (Red)', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row A', breadboardCol: 12 },
      { pinName: 'GND (Black)', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row B', breadboardCol: 12 },
      { pinName: 'DATA (Yellow/Signal)', preferredArduinoPin: 'D2', pinType: 'digital', breadboardRow: 'Row C', breadboardCol: 12, note: 'Requires 4.7kΩ pull-up to 5V' }
    ],
    requiresPullUp: { resistorVal: '4.7kΩ', targetPin: 'DATA (Yellow/Signal)', reason: '1-Wire data bus pull-up' },
    libraries: ['<OneWire.h>', '<DallasTemperature.h>'],
    globalCode: (pins) => `
// DS18B20 1-Wire Setup
#define ONE_WIRE_BUS ${pins['DATA (Yellow/Signal)'] ? pins['DATA (Yellow/Signal)'].replace('D', '') : '2'}
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature dallasSensors(&oneWire);
float currentTempC = 0.0;
float currentTempF = 0.0;`,
    setupCode: () => [
      'dallasSensors.begin();',
      'Serial.println(F("DS18B20 1-Wire Temperature Sensor initialized."));'
    ],
    loopReadCode: () => [
      '// Read temperature from DS18B20 probe',
      'dallasSensors.requestTemperatures();',
      'currentTempC = dallasSensors.getTempCByIndex(0);',
      'currentTempF = DallasTemperature::toFahrenheit(currentTempC);',
      'Serial.print(F("Water Temp: "));',
      'Serial.print(currentTempC, 2);',
      'Serial.print(F(" °C  |  "));',
      'Serial.print(currentTempF, 2);',
      'Serial.println(F(" °F"));'
    ]
  },

  'led': {
    id: 'led',
    name: 'LED Indicator',
    pins: [
      { pinName: 'Anode (Long Leg)', preferredArduinoPin: 'D13', pinType: 'digital', breadboardRow: 'Row E', breadboardCol: 15, note: 'Via 220Ω resistor' },
      { pinName: 'Cathode (Short Leg)', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row E', breadboardCol: 16 }
    ],
    requiresSeriesResistor: { resistorVal: '220Ω', targetPin: 'Anode (Long Leg)', reason: 'Current limiting to prevent burning out LED' },
    globalCode: (pins) => `const int PIN_LED = ${pins['Anode (Long Leg)'] ? pins['Anode (Long Leg)'].replace('D', '') : '13'};`,
    setupCode: () => ['pinMode(PIN_LED, OUTPUT);'],
    loopActionCode: (_pins, cond) => [
      `if (${cond}) {`,
      '  // Turn LED ON',
      '  digitalWrite(PIN_LED, HIGH);',
      '} else {',
      '  // Turn LED OFF',
      '  digitalWrite(PIN_LED, LOW);',
      '}'
    ]
  },

  'buzzer': {
    id: 'buzzer',
    name: 'Piezo Buzzer',
    pins: [
      { pinName: 'Positive (+)', preferredArduinoPin: 'D8', pinType: 'digital', breadboardRow: 'Row J', breadboardCol: 20 },
      { pinName: 'Negative (-)', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row J', breadboardCol: 21 }
    ],
    globalCode: (pins) => `const int PIN_BUZZER = ${pins['Positive (+)'] ? pins['Positive (+)'].replace('D', '') : '8'};`,
    setupCode: () => ['pinMode(PIN_BUZZER, OUTPUT);'],
    loopActionCode: (_pins, cond) => [
      `if (${cond}) {`,
      '  // Alert tone 1kHz',
      '  tone(PIN_BUZZER, 1000);',
      '} else {',
      '  noTone(PIN_BUZZER);',
      '}'
    ]
  },

  'ultrasonic': {
    id: 'ultrasonic',
    name: 'HC-SR04 Ultrasonic',
    pins: [
      { pinName: 'VCC', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row A', breadboardCol: 2 },
      { pinName: 'Trig', preferredArduinoPin: 'D9', pinType: 'digital', breadboardRow: 'Row A', breadboardCol: 3 },
      { pinName: 'Echo', preferredArduinoPin: 'D10', pinType: 'digital', breadboardRow: 'Row A', breadboardCol: 4 },
      { pinName: 'GND', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row A', breadboardCol: 5 }
    ],
    globalCode: (pins) => `
const int PIN_TRIG = ${pins['Trig'] ? pins['Trig'].replace('D', '') : '9'};
const int PIN_ECHO = ${pins['Echo'] ? pins['Echo'].replace('D', '') : '10'};
long echoDuration = 0;
float distanceCm = 0.0;`,
    setupCode: () => [
      'pinMode(PIN_TRIG, OUTPUT);',
      'pinMode(PIN_ECHO, INPUT);'
    ],
    loopReadCode: () => [
      '// Trigger Ultrasonic Pulse',
      'digitalWrite(PIN_TRIG, LOW);',
      'delayMicroseconds(2);',
      'digitalWrite(PIN_TRIG, HIGH);',
      'delayMicroseconds(10);',
      'digitalWrite(PIN_TRIG, LOW);',
      'echoDuration = pulseIn(PIN_ECHO, HIGH, 30000);',
      'distanceCm = (echoDuration == 0) ? -1 : (echoDuration * 0.0343) / 2.0;',
      'Serial.print(F("Distance: "));',
      'Serial.print(distanceCm);',
      'Serial.println(F(" cm"));'
    ]
  },

  'servo-motor': {
    id: 'servo-motor',
    name: 'Servo Motor',
    pins: [
      { pinName: 'Red (VCC)', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row G', breadboardCol: 24 },
      { pinName: 'Brown (GND)', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row G', breadboardCol: 25 },
      { pinName: 'Orange (PWM)', preferredArduinoPin: 'D9', pinType: 'pwm', breadboardRow: 'Row G', breadboardCol: 26 }
    ],
    libraries: ['<Servo.h>'],
    globalCode: (pins) => `
Servo projectServo;
const int PIN_SERVO = ${pins['Orange (PWM)'] ? pins['Orange (PWM)'].replace('D', '') : '9'};`,
    setupCode: () => ['projectServo.attach(PIN_SERVO);', 'projectServo.write(0);'],
    loopActionCode: (_pins, cond) => [
      `if (${cond}) {`,
      '  // Actuate to 90 degrees',
      '  projectServo.write(90);',
      '} else {',
      '  // Return to rest',
      '  projectServo.write(0);',
      '}'
    ]
  },

  'push-button': {
    id: 'push-button',
    name: 'Push Button',
    pins: [
      { pinName: 'Terminal A', preferredArduinoPin: 'D2', pinType: 'digital', breadboardRow: 'Row D', breadboardCol: 8 },
      { pinName: 'Terminal B', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row D', breadboardCol: 10 }
    ],
    globalCode: (pins) => `const int PIN_BUTTON = ${pins['Terminal A'] ? pins['Terminal A'].replace('D', '') : '2'};`,
    setupCode: () => ['pinMode(PIN_BUTTON, INPUT_PULLUP);'],
    loopReadCode: () => [
      '// Active LOW momentary button reading',
      'bool buttonPressed = (digitalRead(PIN_BUTTON) == LOW);',
      'if (buttonPressed) {',
      '  Serial.println(F("Button is PRESSED"));',
      '}'
    ]
  },

  'ldr': {
    id: 'ldr',
    name: 'Light Dependent Resistor (LDR)',
    pins: [
      { pinName: 'Leg 1 (VCC)', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row C', breadboardCol: 18 },
      { pinName: 'Leg 2 (Signal)', preferredArduinoPin: 'A0', pinType: 'analog', breadboardRow: 'Row C', breadboardCol: 19, note: '10kΩ pull-down to GND' }
    ],
    requiresPullUp: { resistorVal: '10kΩ', targetPin: 'Leg 2 (Signal)', reason: 'Voltage divider for analog reading' },
    globalCode: (pins) => `const int PIN_LDR = ${pins['Leg 2 (Signal)'] || 'A0'}; int lightLevel = 0;`,
    setupCode: () => [],
    loopReadCode: () => [
      'lightLevel = analogRead(PIN_LDR);',
      'Serial.print(F("Light Level (0-1023): "));',
      'Serial.println(lightLevel);'
    ]
  },

  'dht11': {
    id: 'dht11',
    name: 'DHT11 Temp & Humidity',
    pins: [
      { pinName: 'VCC', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row A', breadboardCol: 28 },
      { pinName: 'GND', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row A', breadboardCol: 29 },
      { pinName: 'DATA', preferredArduinoPin: 'D4', pinType: 'digital', breadboardRow: 'Row A', breadboardCol: 30 }
    ],
    libraries: ['<DHT.h>'],
    globalCode: (pins) => `
#define DHTPIN ${pins['DATA'] ? pins['DATA'].replace('D', '') : '4'}
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
float humidity = 0.0;
float dhtTempC = 0.0;`,
    setupCode: () => ['dht.begin();'],
    loopReadCode: () => [
      'humidity = dht.readHumidity();',
      'dhtTempC = dht.readTemperature();',
      'Serial.print(F("Humidity: ")); Serial.print(humidity);',
      'Serial.print(F("%  |  Temp: ")); Serial.print(dhtTempC); Serial.println(F("°C"));'
    ]
  },

  'pir-sensor': {
    id: 'pir-sensor',
    name: 'PIR Motion Sensor',
    pins: [
      { pinName: 'VCC', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row F', breadboardCol: 2 },
      { pinName: 'GND', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row F', breadboardCol: 3 },
      { pinName: 'OUT (Signal)', preferredArduinoPin: 'D7', pinType: 'digital', breadboardRow: 'Row F', breadboardCol: 4 }
    ],
    globalCode: (pins) => `const int PIN_PIR = ${pins['OUT (Signal)'] ? pins['OUT (Signal)'].replace('D', '') : '7'}; bool motionDetected = false;`,
    setupCode: () => ['pinMode(PIN_PIR, INPUT);'],
    loopReadCode: () => [
      'motionDetected = (digitalRead(PIN_PIR) == HIGH);',
      'if (motionDetected) Serial.println(F("MOTION DETECTED!"));'
    ]
  },

  'relay': {
    id: 'relay',
    name: '5V Relay Module',
    pins: [
      { pinName: 'VCC', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row B', breadboardCol: 22 },
      { pinName: 'GND', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row B', breadboardCol: 23 },
      { pinName: 'IN (Trigger)', preferredArduinoPin: 'D7', pinType: 'digital', breadboardRow: 'Row B', breadboardCol: 24 }
    ],
    globalCode: (pins) => `const int PIN_RELAY = ${pins['IN (Trigger)'] ? pins['IN (Trigger)'].replace('D', '') : '7'};`,
    setupCode: () => ['pinMode(PIN_RELAY, OUTPUT);', 'digitalWrite(PIN_RELAY, LOW);'],
    loopActionCode: (_pins, cond) => [
      `if (${cond}) {`,
      '  // Switch Relay ON',
      '  digitalWrite(PIN_RELAY, HIGH);',
      '} else {',
      '  // Switch Relay OFF',
      '  digitalWrite(PIN_RELAY, LOW);',
      '}'
    ]
  },

  'soil-moisture': {
    id: 'soil-moisture',
    name: 'Soil Moisture Sensor',
    pins: [
      { pinName: 'VCC', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row H', breadboardCol: 10 },
      { pinName: 'GND', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row H', breadboardCol: 11 },
      { pinName: 'A0 (Analog)', preferredArduinoPin: 'A1', pinType: 'analog', breadboardRow: 'Row H', breadboardCol: 12 }
    ],
    globalCode: (pins) => `const int PIN_SOIL = ${pins['A0 (Analog)'] || 'A1'}; int soilValue = 0;`,
    setupCode: () => [],
    loopReadCode: () => [
      'soilValue = analogRead(PIN_SOIL);',
      'Serial.print(F("Soil Moisture Level: ")); Serial.println(soilValue);'
    ]
  },

  'gas-sensor': {
    id: 'gas-sensor',
    name: 'MQ-2 Gas Sensor',
    pins: [
      { pinName: 'VCC', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row I', breadboardCol: 5 },
      { pinName: 'GND', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row I', breadboardCol: 6 },
      { pinName: 'AO (Analog)', preferredArduinoPin: 'A2', pinType: 'analog', breadboardRow: 'Row I', breadboardCol: 7 }
    ],
    globalCode: (pins) => `const int PIN_GAS = ${pins['AO (Analog)'] || 'A2'}; int gasLevel = 0;`,
    setupCode: () => [],
    loopReadCode: () => [
      'gasLevel = analogRead(PIN_GAS);',
      'Serial.print(F("Gas Concentration: ")); Serial.println(gasLevel);'
    ]
  },

  'lcd-i2c': {
    id: 'lcd-i2c',
    name: 'I2C 16x2 LCD',
    pins: [
      { pinName: 'VCC', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row A', breadboardCol: 18 },
      { pinName: 'GND', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row A', breadboardCol: 19 },
      { pinName: 'SDA', preferredArduinoPin: 'A4', pinType: 'i2c_sda', breadboardRow: 'Row A', breadboardCol: 20 },
      { pinName: 'SCL', preferredArduinoPin: 'A5', pinType: 'i2c_scl', breadboardRow: 'Row A', breadboardCol: 21 }
    ],
    libraries: ['<Wire.h>', '<LiquidCrystal_I2C.h>'],
    globalCode: () => `
// I2C LCD (0x27 is the standard address)
LiquidCrystal_I2C lcd(0x27, 16, 2);`,
    setupCode: () => [
      'lcd.init();',
      'lcd.backlight();',
      'lcd.setCursor(0, 0);',
      'lcd.print(F("STEAM Lab Active"));'
    ]
  },

  'water-level': {
    id: 'water-level',
    name: 'Water Level Sensor',
    pins: [
      { pinName: 'VCC (+)', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row J', breadboardCol: 1 },
      { pinName: 'GND (-)', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row J', breadboardCol: 2 },
      { pinName: 'Signal (S)', preferredArduinoPin: 'A3', pinType: 'analog', breadboardRow: 'Row J', breadboardCol: 3 }
    ],
    globalCode: (pins) => `const int PIN_WATER = ${pins['Signal (S)'] || 'A3'}; int waterLevel = 0;`,
    setupCode: () => [],
    loopReadCode: () => [
      'waterLevel = analogRead(PIN_WATER);',
      'Serial.print(F("Water Depth Reading: ")); Serial.println(waterLevel);'
    ]
  },

  'joystick': {
    id: 'joystick',
    name: 'Analog Joystick',
    pins: [
      { pinName: 'VCC', preferredArduinoPin: '5V', pinType: 'power_5v', breadboardRow: 'Row C', breadboardCol: 24 },
      { pinName: 'GND', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row C', breadboardCol: 25 },
      { pinName: 'VRx', preferredArduinoPin: 'A0', pinType: 'analog', breadboardRow: 'Row C', breadboardCol: 26 },
      { pinName: 'VRy', preferredArduinoPin: 'A1', pinType: 'analog', breadboardRow: 'Row C', breadboardCol: 27 },
      { pinName: 'SW', preferredArduinoPin: 'D2', pinType: 'digital', breadboardRow: 'Row C', breadboardCol: 28 }
    ],
    globalCode: (pins) => `
const int PIN_JOY_X = ${pins['VRx'] || 'A0'};
const int PIN_JOY_Y = ${pins['VRy'] || 'A1'};
const int PIN_JOY_SW = ${pins['SW'] ? pins['SW'].replace('D', '') : '2'};`,
    setupCode: () => ['pinMode(PIN_JOY_SW, INPUT_PULLUP);'],
    loopReadCode: () => [
      'int joyX = analogRead(PIN_JOY_X);',
      'int joyY = analogRead(PIN_JOY_Y);',
      'bool joyBtn = (digitalRead(PIN_JOY_SW) == LOW);',
      'Serial.print(F("Joy X: ")); Serial.print(joyX);',
      'Serial.print(F(" Y: ")); Serial.print(joyY);',
      'Serial.print(F(" Btn: ")); Serial.println(joyBtn ? F("ON") : F("OFF"));'
    ]
  },

  'motor-driver': {
    id: 'motor-driver',
    name: 'L298N Motor Driver',
    pins: [
      { pinName: 'ENA (Speed)', preferredArduinoPin: 'D5', pinType: 'pwm', breadboardRow: 'Row H', breadboardCol: 15 },
      { pinName: 'IN1', preferredArduinoPin: 'D3', pinType: 'digital', breadboardRow: 'Row H', breadboardCol: 16 },
      { pinName: 'IN2', preferredArduinoPin: 'D4', pinType: 'digital', breadboardRow: 'Row H', breadboardCol: 17 },
      { pinName: 'GND (Common)', preferredArduinoPin: 'GND', pinType: 'gnd', breadboardRow: 'Row H', breadboardCol: 18 }
    ],
    globalCode: (pins) => `
const int MOTOR_ENA = ${pins['ENA (Speed)'] ? pins['ENA (Speed)'].replace('D', '') : '5'};
const int MOTOR_IN1 = ${pins['IN1'] ? pins['IN1'].replace('D', '') : '3'};
const int MOTOR_IN2 = ${pins['IN2'] ? pins['IN2'].replace('D', '') : '4'};`,
    setupCode: () => [
      'pinMode(MOTOR_ENA, OUTPUT);',
      'pinMode(MOTOR_IN1, OUTPUT);',
      'pinMode(MOTOR_IN2, OUTPUT);'
    ],
    loopActionCode: (_pins, cond) => [
      `if (${cond}) {`,
      '  // Drive Motor Forward at 75% power',
      '  digitalWrite(MOTOR_IN1, HIGH);',
      '  digitalWrite(MOTOR_IN2, LOW);',
      '  analogWrite(MOTOR_ENA, 190);',
      '} else {',
      '  // Stop Motor',
      '  digitalWrite(MOTOR_IN1, LOW);',
      '  digitalWrite(MOTOR_IN2, LOW);',
      '  analogWrite(MOTOR_ENA, 0);',
      '}'
    ]
  }
};

/**
 * Self-Processing Collision-Free Pin Allocation
 */
export function allocatePins(
  selectedComponentIds: string[],
  connectionModes: Record<string, ConnectionMode> = {}
): {
  connections: CustomConnection[];
  assignedPinsByComp: Record<string, Record<string, string>>;
} {
  const usedDigitalPins = new Set<string>();
  const usedAnalogPins = new Set<string>();
  const connections: CustomConnection[] = [];
  const assignedPinsByComp: Record<string, Record<string, string>> = {};

  // First pass: assign I2C pins fixed to A4/A5
  const hasI2C = selectedComponentIds.some(id => id === 'lcd-i2c' || id === 'mpu6050');
  if (hasI2C) {
    usedAnalogPins.add('A4');
    usedAnalogPins.add('A5');
  }

  for (const compId of selectedComponentIds) {
    const rule = COMPONENT_RULES[compId];
    if (!rule) continue;

    assignedPinsByComp[compId] = {};

    // Determine connection mode: direct to Arduino header vs mounted through breadboard
    // Discrete passive components default to breadboard; modular breakout boards default to direct or breadboard
    const mode: ConnectionMode = connectionModes[compId] || (
      ['led', 'resistor', 'resistor-330', 'ldr', 'push-button'].includes(compId)
        ? 'breadboard'
        : 'direct'
    );
    const isDirect = mode === 'direct';

    for (const pin of rule.pins) {
      let finalPin = pin.preferredArduinoPin;

      if (pin.pinType === 'digital') {
        if (usedDigitalPins.has(finalPin)) {
          const available = DIGITAL_PINS.find(p => !usedDigitalPins.has(p));
          if (available) finalPin = available;
        }
        usedDigitalPins.add(finalPin);
      } else if (pin.pinType === 'pwm') {
        if (usedDigitalPins.has(finalPin)) {
          const availablePWM = PWM_PINS.find(p => !usedDigitalPins.has(p));
          if (availablePWM) {
            finalPin = availablePWM;
          } else {
            const availableDig = DIGITAL_PINS.find(p => !usedDigitalPins.has(p));
            if (availableDig) finalPin = availableDig;
          }
        }
        usedDigitalPins.add(finalPin);
      } else if (pin.pinType === 'analog') {
        if (usedAnalogPins.has(finalPin)) {
          const available = ANALOG_PINS.find(p => !usedAnalogPins.has(p));
          if (available) finalPin = available;
        }
        usedAnalogPins.add(finalPin);
      }

      assignedPinsByComp[compId][pin.pinName] = finalPin;

      // Exactly ONE unambiguous connection entry per pin - never duplicate direct and breadboard!
      connections.push({
        compId: compId,
        compPin: pin.pinName,
        arduinoPin: finalPin,
        connectionMode: mode,
        breadboardCoords: isDirect ? undefined : `${pin.breadboardRow}, Col ${pin.breadboardCol}`
      });
    }
  }

  return { connections, assignedPinsByComp };
}

/**
 * Deterministic Circuit Schematic & Code Generator
 */
export function generateSchematicLocal(
  selectedComponentIds: string[],
  intent: string,
  resistors: ResistorItem[] = [],
  connectionModes: Record<string, ConnectionMode> = {}
): CircuitResult {
  const { connections, assignedPinsByComp } = allocatePins(selectedComponentIds, connectionModes);

  const hasDS18B20 = selectedComponentIds.includes('ds18b20');
  const hasLED = selectedComponentIds.includes('led');
  const hasBuzzer = selectedComponentIds.includes('buzzer');
  const hasServo = selectedComponentIds.includes('servo-motor');
  const hasUltrasonic = selectedComponentIds.includes('ultrasonic');
  const hasMotor = selectedComponentIds.includes('motor-driver');
  const hasRelay = selectedComponentIds.includes('relay');
  const hasLDR = selectedComponentIds.includes('ldr');
  const hasLCD = selectedComponentIds.includes('lcd-i2c');

  // Handle Resistors integration (Always mounted on breadboard)
  if (resistors && resistors.length > 0) {
    resistors.forEach((res, idx) => {
      let sideA = 'Circuit Node';
      let sideB = 'Arduino Pin';
      let row = `Row ${String.fromCharCode(65 + (idx % 8))}`;
      let col = 12 + idx * 3;

      if (hasDS18B20 && (res.value.includes('4.7') || idx === 0)) {
        const ds18DataPin = assignedPinsByComp['ds18b20']?.['DATA (Yellow/Signal)'] || 'D2';
        sideA = '5V Power Rail (Pull-Up)';
        sideB = `DS18B20 DATA (${ds18DataPin})`;
        row = 'Row C';
        col = 13;
      } else if (hasLED && (res.value.includes('220') || res.value.includes('330'))) {
        const ledPin = assignedPinsByComp['led']?.['Anode (Long Leg)'] || 'D13';
        sideA = `LED Anode (Row E, Col 15)`;
        sideB = `Arduino ${ledPin}`;
        row = 'Row E';
        col = 14;
      } else if (hasLDR && res.value.includes('10k')) {
        sideA = 'LDR Signal / A0';
        sideB = 'GND Rail (Pull-down)';
        row = 'Row C';
        col = 20;
      }

      connections.push({
        compId: res.id,
        compPin: `Pin 1 (${res.value})`,
        arduinoPin: sideA,
        connectionMode: 'breadboard',
        breadboardCoords: `${row}, Col ${col}`
      });

      connections.push({
        compId: res.id,
        compPin: `Pin 2 (${res.value})`,
        arduinoPin: sideB,
        connectionMode: 'breadboard',
        breadboardCoords: `${row}, Col ${col + 1}`
      });
    });
  }

  // Wires Calculation based on explicit connection modes
  const directConnections = connections.filter(c => c.connectionMode === 'direct');
  const breadboardConnections = connections.filter(c => c.connectionMode === 'breadboard');

  const wires: WireSuggestion[] = [];

  if (breadboardConnections.length > 0) {
    const bbSignalWires = breadboardConnections.filter(c => c.arduinoPin.startsWith('D') || c.arduinoPin.startsWith('A')).length;
    wires.push({
      type: 'Male-to-Male',
      count: Math.max(2, bbSignalWires + 2),
      reason: 'Connects breadboard tie-points and power rails directly to Arduino Uno headers.'
    });
  }

  if (directConnections.length > 0) {
    wires.push({
      type: 'Male-to-Female',
      count: directConnections.length,
      reason: 'Direct Dupont jumper cables connecting modular sensor pins directly to Arduino Uno headers (bypassing breadboard).'
    });
  }

  // Common power and GND if breadboard rails are used
  const hasBreadboardRails = breadboardConnections.some(c => c.arduinoPin === '5V' || c.arduinoPin === 'GND' || c.arduinoPin.includes('Rail'));
  if (hasBreadboardRails) {
    wires.push({
      type: 'Male-to-Male',
      count: 2,
      reason: 'Power distribution jumpers (5V & GND) from Arduino to breadboard power rails (+ and -).'
    });
  }

  // Assemble Breadboard and Direct Wiring Guide
  const directComps = selectedComponentIds.filter(id => {
    const mode = connectionModes[id] || (
      ['led', 'resistor', 'resistor-330', 'ldr', 'push-button'].includes(id)
        ? 'breadboard'
        : 'direct'
    );
    return mode === 'direct';
  });

  const breadboardComps = selectedComponentIds.filter(id => !directComps.includes(id));

  const guideSections: string[] = ['### Self-Processing Circuit Assembly Guide:'];

  if (breadboardComps.length > 0 || resistors.length > 0) {
    guideSections.push('#### Part 1: Breadboard Connections');
    guideSections.push('1. **Power Rails**: Connect Arduino **5V** to Breadboard **Red (+) Rail** and Arduino **GND** to **Blue (-) Rail**.');
    guideSections.push('2. **Mounted Components**: Insert the following breadboard-configured components into their designated rows (do NOT double-wire to Arduino directly to avoid conflicts):');
    breadboardComps.forEach(id => {
      const rule = COMPONENT_RULES[id];
      if (rule) {
        guideSections.push(`   - **${rule.name}**: Insert pins into ${rule.pins.map(p => `${p.pinName} at ${p.breadboardRow}, Col ${p.breadboardCol}`).join('; ')}.`);
      }
    });
    if (resistors.length > 0) {
      guideSections.push(`   - **Resistors (${resistors.length})**: Bridge designated tie-points across rows for current limiting or 1-Wire pull-ups.`);
    }
    guideSections.push('3. **Jumper Wires to Arduino**: Run Male-to-Male jumper wires from the breadboard tie-point columns into the assigned Arduino pins.');
  }

  if (directComps.length > 0) {
    guideSections.push('#### Part 2: Direct-to-Arduino Connections (No Breadboard)');
    guideSections.push('The following modules connect **DIRECTLY** to Arduino headers via Female-to-Male jumper cables without touching the breadboard:');
    directComps.forEach(id => {
      const rule = COMPONENT_RULES[id];
      if (rule) {
        const pinMap = assignedPinsByComp[id] || {};
        guideSections.push(`   - **${rule.name}**: ${Object.entries(pinMap).map(([pName, aPin]) => `${pName} ➔ Arduino ${aPin}`).join(', ')}.`);
      }
    });
    guideSections.push('*(Note: Direct connection completely eliminates breadboard contact conflicts and avoids duplicate wiring).*');
  }

  const breadboardGuide = guideSections.join('\n');

  // Code Synthesis
  const libraries = new Set<string>();
  const globalSnippets: string[] = [];
  const setupSnippets: string[] = [];
  const loopReadSnippets: string[] = [];
  const loopActionSnippets: string[] = [];

  // Determine trigger condition from intent
  const lowerIntent = intent.toLowerCase();
  let triggerCondition = 'false';
  let triggerDescription = 'Condition met';

  if (hasDS18B20) {
    if (lowerIntent.includes('30') || lowerIntent.includes('hot')) {
      triggerCondition = 'currentTempC >= 30.0';
      triggerDescription = 'Temperature exceeds 30°C';
    } else if (lowerIntent.includes('25') || lowerIntent.includes('warm')) {
      triggerCondition = 'currentTempC >= 25.0';
      triggerDescription = 'Temperature exceeds 25°C';
    } else {
      triggerCondition = 'currentTempC >= 28.0';
      triggerDescription = 'Temperature exceeds threshold (28°C)';
    }
  } else if (hasUltrasonic) {
    triggerCondition = '(distanceCm > 0 && distanceCm < 15.0)';
    triggerDescription = 'Object detected closer than 15cm';
  } else if (hasLDR) {
    triggerCondition = 'lightLevel < 400';
    triggerDescription = 'Ambient light drops below threshold';
  } else if (selectedComponentIds.includes('push-button')) {
    triggerCondition = 'buttonPressed';
    triggerDescription = 'User pushes momentary tactile button';
  } else if (selectedComponentIds.includes('pir-sensor')) {
    triggerCondition = 'motionDetected';
    triggerDescription = 'PIR motion sensor detects movement';
  } else if (selectedComponentIds.includes('soil-moisture')) {
    triggerCondition = 'soilValue < 300';
    triggerDescription = 'Soil moisture drops below threshold (dry soil)';
  } else {
    triggerCondition = '(millis() % 2000 < 1000)';
    triggerDescription = 'Periodic 1-second pulse cycle';
  }

  // Ensure triggerCondition is strictly clean C++ with no comment markers
  triggerCondition = triggerCondition.replace(/\/\/.*$/, '').trim();

  selectedComponentIds.forEach(id => {
    const rule = COMPONENT_RULES[id];
    if (!rule) return;

    if (rule.libraries) {
      rule.libraries.forEach(lib => libraries.add(lib));
    }

    const compPins = assignedPinsByComp[id] || {};
    if (rule.globalCode) globalSnippets.push(rule.globalCode(compPins));
    if (rule.setupCode) setupSnippets.push(...rule.setupCode(compPins));
    if (rule.loopReadCode) loopReadSnippets.push(...rule.loopReadCode(compPins));
    if (rule.loopActionCode) loopActionSnippets.push(...rule.loopActionCode(compPins, triggerCondition));
  });

  // LCD display integration in loop if present
  if (hasLCD && hasDS18B20) {
    loopReadSnippets.push(
      '// Update LCD Screen with live temperature',
      'lcd.setCursor(0, 1);',
      'lcd.print(F("Temp: "));',
      'lcd.print(currentTempC, 1);',
      'lcd.print(F(" C   "));'
    );
  }

  // Synthesize complete Arduino C++ file
  const codeLines = [
    '/**',
    ' * STEAM Lab - Self-Processing Arduino Sketch',
    ` * Project Purpose: "${intent || 'Automated Sensor Workbench'}"`,
    ` * Generated locally without external API dependencies.`,
    ' */',
    ''
  ];

  if (libraries.size > 0) {
    libraries.forEach(lib => codeLines.push(`#include ${lib}`));
    codeLines.push('');
  }

  if (globalSnippets.length > 0) {
    codeLines.push('// --- Global Variables and Pin Definitions ---');
    globalSnippets.forEach(s => codeLines.push(s.trim()));
    codeLines.push('');
  }

  codeLines.push('void setup() {');
  codeLines.push('  // Initialize Serial communication for real-time telemetry');
  codeLines.push('  Serial.begin(9600);');
  codeLines.push('  delay(500);');
  codeLines.push(`  Serial.println(F("--- STEAM Lab System Initialized ---"));`);
  
  if (setupSnippets.length > 0) {
    setupSnippets.forEach(s => codeLines.push(`  ${s}`));
  }
  codeLines.push('}');
  codeLines.push('');

  codeLines.push('void loop() {');
  if (loopReadSnippets.length > 0) {
    codeLines.push('  // --- Sensor Acquisitions ---');
    loopReadSnippets.forEach(s => codeLines.push(`  ${s}`));
    codeLines.push('');
  }

  if (loopActionSnippets.length > 0) {
    codeLines.push('  // --- Actuator Decision Logic ---');
    codeLines.push(`  // Target condition: ${triggerDescription}`);
    loopActionSnippets.forEach(s => codeLines.push(`  ${s}`));
    codeLines.push('');
  }

  codeLines.push('  // Heartbeat loop delay');
  codeLines.push('  delay(500);');
  codeLines.push('}');

  const fullCode = codeLines.join('\n');

  // Generate deterministic serial connection guide for every component
  const sequentialGuides = generateSequentialGuides(
    selectedComponentIds,
    assignedPinsByComp,
    resistors,
    connectionModes
  );

  // Generate detailed explanation
  const codeExplanation = `### Self-Processing Code Analysis
- **Architecture**: Assembled deterministically for ${selectedComponentIds.length} connected hardware modules.
- **Pin Mapping**: Automatically allocated collision-free pins (${Object.entries(assignedPinsByComp).map(([c, pins]) => `${c}: ${Object.values(pins).join(', ')}`).join(' | ')}).
${hasDS18B20 ? '- **1-Wire Temperature Protocol**: Handled by OneWire and DallasTemperature using internal ROM address indexing.\n' : ''}${resistors.length > 0 ? `- **Resistor Configuration**: Integrated ${resistors.length} resistor(s) (${resistors.map(r => `${r.id}: ${r.value}`).join(', ')}).\n` : ''}- **Execution Loop**: Continuously samples inputs, prints human-readable telemetry to the Serial Monitor at 9600 baud, and activates output actuators when the condition (\`${triggerCondition}\`) is satisfied.`;

  return {
    connections,
    wires,
    breadboardGuide,
    code: fullCode,
    codeExplanation,
    sequentialGuides
  };
}

/**
 * Generates serial, physical leg-by-leg step-by-step connection sequences for each component
 */
export function generateSequentialGuides(
  selectedComponentIds: string[],
  assignedPinsByComp: Record<string, Record<string, string>>,
  resistors: ResistorItem[],
  connectionModes: Record<string, ConnectionMode>
): ComponentSequentialGuide[] {
  const guides: ComponentSequentialGuide[] = [];

  selectedComponentIds.forEach(id => {
    const rule = COMPONENT_RULES[id];
    const compMeta = POPULAR_COMPONENTS.find(p => p.id === id);
    const compName = rule?.name || compMeta?.name || id.toUpperCase();
    const mode: ConnectionMode = connectionModes[id] || (
      ['led', 'resistor', 'resistor-330', 'ldr', 'push-button'].includes(id)
        ? 'breadboard'
        : 'direct'
    );
    const pinMap = assignedPinsByComp[id] || {};

    if (id === 'led') {
      const ledPin = pinMap['Anode (Long Leg)'] || 'D13';
      const resVal = resistors.find(r => r.value.includes('220') || r.value.includes('330'))?.value || '220Ω';

      if (mode === 'breadboard') {
        guides.push({
          componentId: id,
          componentName: compName,
          location: 'breadboard',
          locationDetails: 'Breadboard Row E, Columns 15 & 16',
          overview: `The LED is located on the breadboard. The long leg (anode) goes to one leg of the ${resVal} resistor in series, the other leg of the resistor connects to Arduino digital pin ${ledPin}, and the other leg of the LED (cathode) goes to Arduino GND.`,
          steps: [
            {
              id: `${id}-step-1`,
              stepNumber: 1,
              instruction: `Insert the LED into the breadboard: place the long leg (Anode +) into Row E Col 15, and the shorter flat-notched leg (Cathode -) into Row E Col 16.`,
              fromPoint: 'LED Anode & Cathode',
              toPoint: 'Breadboard Row E, Cols 15 & 16',
              wireType: 'Component Legs Insertion',
              details: 'The longer leg is the positive Anode; the shorter leg (and flat edge on the plastic collar) is the negative Cathode.',
              completed: false
            },
            {
              id: `${id}-step-2`,
              stepNumber: 2,
              instruction: `Connect the resistor in series: insert one leg of the ${resVal} resistor into Row E Col 15 (sharing the tie-point column with the LED long leg), and insert the second leg into Row E Col 18.`,
              fromPoint: 'LED Long Leg (Anode) at Row E Col 15',
              toPoint: `Resistor (${resVal}) Leg 1 at Row E Col 15`,
              wireType: 'Series Breadboard Tie-Point',
              details: `Placing both legs in column 15 creates a direct physical series connection to limit current through the LED.`,
              completed: false
            },
            {
              id: `${id}-step-3`,
              stepNumber: 3,
              instruction: `Connect the other part of the resistor to the Arduino: run a Male-to-Male jumper wire from Row E Col 18 (the second leg of the resistor) to Arduino digital pin ${ledPin}.`,
              fromPoint: `Resistor Leg 2 (Row E Col 18)`,
              toPoint: `Arduino Digital Pin ${ledPin}`,
              wireType: 'Male-to-Male Jumper Wire',
              details: `When Arduino pin ${ledPin} outputs 5V (HIGH), electric current flows through the resistor into the LED.`,
              completed: false
            },
            {
              id: `${id}-step-4`,
              stepNumber: 4,
              instruction: `Connect the other leg of the LED to Arduino GND: run a Male-to-Male jumper wire from Row E Col 16 (the short leg of the LED) directly to an Arduino GND pin (or the breadboard blue negative rail).`,
              fromPoint: 'LED Short Leg (Cathode) at Row E Col 16',
              toPoint: 'Arduino GND (or Blue - Rail)',
              wireType: 'Male-to-Male Jumper Wire',
              details: 'Completes the circuit return path back to the Arduino ground reference.',
              completed: false
            }
          ]
        });
      } else {
        guides.push({
          componentId: id,
          componentName: compName,
          location: 'direct',
          locationDetails: 'Direct DuPont Jumper Wiring with Inline Resistor',
          overview: `The LED connects directly to Arduino headers using DuPont jumper cables with a ${resVal} resistor placed inline on the positive lead.`,
          steps: [
            {
              id: `${id}-step-1`,
              stepNumber: 1,
              instruction: `Connect the long leg (Anode +) of the LED to one leg of the ${resVal} current-limiting resistor.`,
              fromPoint: 'LED Long Leg (Anode)',
              toPoint: `Resistor (${resVal}) Leg 1`,
              wireType: 'Series Lead Connection',
              details: 'Never connect an LED directly to 5V without a current-limiting resistor, or the diode will burn out.',
              completed: false
            },
            {
              id: `${id}-step-2`,
              stepNumber: 2,
              instruction: `Connect the second leg of the ${resVal} resistor using a Female-to-Male jumper wire directly into Arduino digital pin ${ledPin}.`,
              fromPoint: `Resistor (${resVal}) Leg 2`,
              toPoint: `Arduino Digital Pin ${ledPin}`,
              wireType: 'Female-to-Male Jumper Cable',
              details: 'This sends the digital switching signal directly to the resistor input.',
              completed: false
            },
            {
              id: `${id}-step-3`,
              stepNumber: 3,
              instruction: `Connect the short leg (Cathode -) of the LED using a Female-to-Male jumper wire directly into an Arduino GND header pin.`,
              fromPoint: 'LED Short Leg (Cathode)',
              toPoint: 'Arduino GND Header',
              wireType: 'Female-to-Male Jumper Cable',
              details: 'Provides the common ground return to the microcontroller.',
              completed: false
            }
          ]
        });
      }
    } else if (id === 'ds18b20') {
      const dataPin = pinMap['DATA (Yellow/Signal)'] || 'D2';
      const pullUpVal = resistors.find(r => r.value.includes('4.7k') || r.value.includes('4k7'))?.value || '4.7kΩ';

      guides.push({
        componentId: id,
        componentName: compName,
        location: mode,
        locationDetails: mode === 'breadboard' ? 'Breadboard Row A-C, Col 12' : 'Direct Sensor Lead Harness',
        overview: `The DS18B20 digital temperature probe communicates over a single 1-Wire data bus and requires a ${pullUpVal} pull-up resistor between the DATA line and the 5V line.`,
        steps: [
          {
            id: `${id}-step-1`,
            stepNumber: 1,
            instruction: mode === 'breadboard' 
              ? `Insert the DS18B20 probe into the breadboard: insert VCC (Red) into Row A Col 12, GND (Black) into Row B Col 12, and DATA (Yellow) into Row C Col 12.`
              : `Identify the 3 wires of the DS18B20 probe: Red is VCC (+5V), Black is GND, and Yellow is DATA signal.`,
            fromPoint: 'DS18B20 Sensor Leads',
            toPoint: mode === 'breadboard' ? 'Breadboard Rows A, B, C Col 12' : 'Wire Harness',
            wireType: mode === 'breadboard' ? 'Component Insertion' : 'Direct Wire Leads',
            details: 'Ensure the pinout matches correctly to avoid reverse polarity heating.',
            completed: false
          },
          {
            id: `${id}-step-2`,
            stepNumber: 2,
            instruction: `Install the pull-up resistor: place one leg of the ${pullUpVal} resistor into the VCC line (Red wire / Row A Col 12) and the other leg into the DATA line (Yellow wire / Row C Col 12).`,
            fromPoint: `VCC Line (Red)`,
            toPoint: `DATA Line (Yellow)`,
            wireType: `Resistor (${pullUpVal}) Bridge`,
            details: `The 1-Wire protocol relies on an open-drain bus: the ${pullUpVal} resistor pulls the data line HIGH when sensors are idle.`,
            completed: false
          },
          {
            id: `${id}-step-3`,
            stepNumber: 3,
            instruction: `Connect VCC power: run a jumper wire from the VCC connection (Row A Col 12 / Red wire) to Arduino 5V.`,
            fromPoint: 'VCC (Red) + Resistor Leg 1',
            toPoint: 'Arduino 5V Header',
            wireType: mode === 'breadboard' ? 'Male-to-Male Jumper' : 'Female-to-Male Jumper',
            details: 'Supplies regulated 5V DC power to the internal Dallas semiconductor logic.',
            completed: false
          },
          {
            id: `${id}-step-4`,
            stepNumber: 4,
            instruction: `Connect DATA signal: run a jumper wire from the DATA connection (Row C Col 12 / Yellow wire) to Arduino digital pin ${dataPin}.`,
            fromPoint: 'DATA (Yellow) + Resistor Leg 2',
            toPoint: `Arduino Digital Pin ${dataPin}`,
            wireType: mode === 'breadboard' ? 'Male-to-Male Jumper' : 'Female-to-Male Jumper',
            details: `Digital pin ${dataPin} sends reset pulses and reads microsecond temperature scratchpad packets.`,
            completed: false
          },
          {
            id: `${id}-step-5`,
            stepNumber: 5,
            instruction: `Connect GND: run a jumper wire from the GND lead (Row B Col 12 / Black wire) to Arduino GND.`,
            fromPoint: 'GND (Black)',
            toPoint: 'Arduino GND Header',
            wireType: mode === 'breadboard' ? 'Male-to-Male Jumper' : 'Female-to-Male Jumper',
            details: 'Ground connection creates common circuit reference.',
            completed: false
          }
        ]
      });
    } else if (id === 'push-button') {
      const btnPin = pinMap['Terminal A'] || 'D2';
      guides.push({
        componentId: id,
        componentName: compName,
        location: 'breadboard',
        locationDetails: 'Breadboard Center Trough (Row D, Cols 8 & 10)',
        overview: `The tactile push button sits across the breadboard center trough. Terminal A connects to Arduino digital pin ${btnPin} (configured in code with INPUT_PULLUP), and Terminal B connects to Arduino GND.`,
        steps: [
          {
            id: `${id}-step-1`,
            stepNumber: 1,
            instruction: `Position the push button: place the 4-pin tactile switch straddling the center divider trough of the breadboard, so Terminal A sits in Row D Col 8 and Terminal B sits in Row D Col 10.`,
            fromPoint: 'Tactile Button Switch',
            toPoint: 'Breadboard Row D, Cols 8 & 10',
            wireType: 'Trough-Straddle Insertion',
            details: 'Straddling the center trough ensures the left and right terminal pairs do not short together.',
            completed: false
          },
          {
            id: `${id}-step-2`,
            stepNumber: 2,
            instruction: `Connect Terminal A to Arduino: run a Male-to-Male jumper wire from Row D Col 8 to Arduino digital pin ${btnPin}.`,
            fromPoint: 'Terminal A (Row D Col 8)',
            toPoint: `Arduino Digital Pin ${btnPin}`,
            wireType: 'Male-to-Male Jumper Wire',
            details: `Configured as INPUT_PULLUP in code so the pin stays HIGH until the button is clicked.`,
            completed: false
          },
          {
            id: `${id}-step-3`,
            stepNumber: 3,
            instruction: `Connect Terminal B to Ground: run a Male-to-Male jumper wire from Row D Col 10 to Arduino GND (or breadboard blue GND rail).`,
            fromPoint: 'Terminal B (Row D Col 10)',
            toPoint: 'Arduino GND',
            wireType: 'Male-to-Male Jumper Wire',
            details: 'When the button is clicked, it connects digital pin to GND, pulling the reading to LOW.',
            completed: false
          }
        ]
      });
    } else if (id === 'ldr') {
      const analogPin = pinMap['Leg 2 (Signal)'] || 'A0';
      guides.push({
        componentId: id,
        componentName: compName,
        location: 'breadboard',
        locationDetails: 'Breadboard Row C, Cols 18 & 19',
        overview: `The Photoresistor (LDR) is wired in series with a 10kΩ pull-down resistor to create a voltage divider. The analog signal tap between them connects to Arduino pin ${analogPin}.`,
        steps: [
          {
            id: `${id}-step-1`,
            stepNumber: 1,
            instruction: `Insert the LDR into the breadboard: insert Leg 1 into Row C Col 18, and Leg 2 into Row C Col 19.`,
            fromPoint: 'LDR Photoresistor',
            toPoint: 'Breadboard Row C, Cols 18 & 19',
            wireType: 'Component Legs Insertion',
            details: 'LDRs are non-polar so either leg can serve as Leg 1 or Leg 2.',
            completed: false
          },
          {
            id: `${id}-step-2`,
            stepNumber: 2,
            instruction: `Connect Leg 1 to 5V: run a jumper wire from Row C Col 18 to the Breadboard Red (+) 5V power rail.`,
            fromPoint: 'LDR Leg 1 (Row C Col 18)',
            toPoint: 'Breadboard 5V (+) Rail',
            wireType: 'Male-to-Male Jumper Wire',
            details: 'Supplies 5V potential into the top side of the light-sensitive resistor.',
            completed: false
          },
          {
            id: `${id}-step-3`,
            stepNumber: 3,
            instruction: `Connect the 10kΩ resistor in series: insert one leg into Row C Col 19 (in series with Leg 2 of the LDR), and insert the second leg into the Breadboard Blue (-) GND rail.`,
            fromPoint: 'LDR Leg 2 (Row C Col 19)',
            toPoint: '10kΩ Resistor Leg 1 (Row C Col 19) to GND',
            wireType: 'Series Voltage Divider Resistor',
            details: 'Forms a voltage divider: changing light alters the LDR resistance and shifts the midpoint voltage.',
            completed: false
          },
          {
            id: `${id}-step-4`,
            stepNumber: 4,
            instruction: `Connect the analog measurement tap: run a jumper wire from Row C Col 19 (the junction between LDR and resistor) to Arduino Analog pin ${analogPin}.`,
            fromPoint: 'LDR / Resistor Junction (Row C Col 19)',
            toPoint: `Arduino Analog Pin ${analogPin}`,
            wireType: 'Male-to-Male Jumper Wire',
            details: `Arduino ADC reads 0-1023 (0V to 5V) proportional to light level.`,
            completed: false
          }
        ]
      });
    } else if (id === 'buzzer') {
      const buzzerPin = pinMap['Positive (+)'] || 'D8';
      guides.push({
        componentId: id,
        componentName: compName,
        location: mode,
        locationDetails: mode === 'breadboard' ? 'Breadboard Row J, Cols 20 & 21' : 'Direct Header Leads',
        overview: `The Piezo buzzer emits audible frequencies when square waves are sent to its positive (+) lead from Arduino digital pin ${buzzerPin}.`,
        steps: [
          {
            id: `${id}-step-1`,
            stepNumber: 1,
            instruction: mode === 'breadboard'
              ? `Insert the buzzer: insert the longer positive leg (+) into Row J Col 20, and the shorter negative leg (-) into Row J Col 21.`
              : `Identify buzzer polarity: the longer lead or casing marked with (+) is positive; the shorter lead is negative (-).`,
            fromPoint: 'Piezo Buzzer',
            toPoint: mode === 'breadboard' ? 'Breadboard Row J, Cols 20 & 21' : 'Header Jumpers',
            wireType: mode === 'breadboard' ? 'Component Insertion' : 'Direct Leads',
            details: 'Observe polarity markings on top of the cylindrical plastic housing.',
            completed: false
          },
          {
            id: `${id}-step-2`,
            stepNumber: 2,
            instruction: `Connect the positive (+) terminal: run a jumper wire from the buzzer positive leg (Row J Col 20) to Arduino digital pin ${buzzerPin}.`,
            fromPoint: 'Buzzer Positive (+) Leg',
            toPoint: `Arduino Digital Pin ${buzzerPin}`,
            wireType: mode === 'breadboard' ? 'Male-to-Male Jumper' : 'Female-to-Male Jumper',
            details: `Arduino uses tone() to oscillate digital pin ${buzzerPin} at 1000Hz.`,
            completed: false
          },
          {
            id: `${id}-step-3`,
            stepNumber: 3,
            instruction: `Connect the negative (-) terminal: run a jumper wire from the buzzer negative leg (Row J Col 21) to Arduino GND.`,
            fromPoint: 'Buzzer Negative (-) Leg',
            toPoint: 'Arduino GND',
            wireType: mode === 'breadboard' ? 'Male-to-Male Jumper' : 'Female-to-Male Jumper',
            details: 'Ground return path completes the piezoelectric element circuit.',
            completed: false
          }
        ]
      });
    } else if (id === 'ultrasonic') {
      const trigPin = pinMap['Trig'] || 'D9';
      const echoPin = pinMap['Echo'] || 'D10';
      guides.push({
        componentId: id,
        componentName: compName,
        location: mode,
        locationDetails: mode === 'breadboard' ? 'Breadboard Columns 2 to 5' : 'Direct DuPont Cable Harness',
        overview: `The HC-SR04 ultrasonic distance sensor uses 4 pins: VCC (+5V), Trig (pulse transmitter on pin ${trigPin}), Echo (pulse receiver on pin ${echoPin}), and GND.`,
        steps: [
          {
            id: `${id}-step-1`,
            stepNumber: 1,
            instruction: mode === 'breadboard'
              ? `Insert the 4 pins of HC-SR04 into breadboard columns 2 through 5: VCC in Col 2, Trig in Col 3, Echo in Col 4, GND in Col 5.`
              : `Connect 4 Female-to-Male DuPont jumper cables to the HC-SR04 header pins: VCC, Trig, Echo, and GND.`,
            fromPoint: 'HC-SR04 Sensor Pins',
            toPoint: mode === 'breadboard' ? 'Breadboard Cols 2, 3, 4, 5' : 'DuPont Cable Harness',
            wireType: mode === 'breadboard' ? 'Header Insertion' : 'Female-to-Male DuPont',
            details: 'Mount facing outward with ultrasonic transducers clear of obstacles.',
            completed: false
          },
          {
            id: `${id}-step-2`,
            stepNumber: 2,
            instruction: `Connect VCC: run a jumper wire from the sensor VCC pin to Arduino 5V.`,
            fromPoint: 'HC-SR04 VCC Pin',
            toPoint: 'Arduino 5V Header',
            wireType: mode === 'breadboard' ? 'Male-to-Male Jumper' : 'Female-to-Male Jumper',
            details: 'Transducers require steady 5V power to fire 40kHz ultrasonic burst bursts.',
            completed: false
          },
          {
            id: `${id}-step-3`,
            stepNumber: 3,
            instruction: `Connect Trig (Trigger): run a jumper wire from the sensor Trig pin to Arduino digital pin ${trigPin}.`,
            fromPoint: 'HC-SR04 Trig Pin',
            toPoint: `Arduino Digital Pin ${trigPin}`,
            wireType: mode === 'breadboard' ? 'Male-to-Male Jumper' : 'Female-to-Male Jumper',
            details: `A 10-microsecond HIGH pulse from pin ${trigPin} triggers ultrasonic emission.`,
            completed: false
          },
          {
            id: `${id}-step-4`,
            stepNumber: 4,
            instruction: `Connect Echo (Listener): run a jumper wire from the sensor Echo pin to Arduino digital pin ${echoPin}.`,
            fromPoint: 'HC-SR04 Echo Pin',
            toPoint: `Arduino Digital Pin ${echoPin}`,
            wireType: mode === 'breadboard' ? 'Male-to-Male Jumper' : 'Female-to-Male Jumper',
            details: `Arduino measures the duration Echo stays HIGH with pulseIn() to compute distance.`,
            completed: false
          },
          {
            id: `${id}-step-5`,
            stepNumber: 5,
            instruction: `Connect GND: run a jumper wire from the sensor GND pin to Arduino GND.`,
            fromPoint: 'HC-SR04 GND Pin',
            toPoint: 'Arduino GND Header',
            wireType: mode === 'breadboard' ? 'Male-to-Male Jumper' : 'Female-to-Male Jumper',
            details: 'Ground connection for echo timing reference.',
            completed: false
          }
        ]
      });
    } else if (id === 'servo-motor') {
      const servoPin = pinMap['Orange (PWM)'] || 'D9';
      guides.push({
        componentId: id,
        componentName: compName,
        location: 'direct',
        locationDetails: 'Standard 3-Pin Female Servo Lead Header',
        overview: `Micro-servo with 3-pin lead: Brown (GND), Red (5V Power), and Orange (PWM signal on pin ${servoPin}).`,
        steps: [
          {
            id: `${id}-step-1`,
            stepNumber: 1,
            instruction: `Identify the 3 servo connector leads: Brown (or Black) is Ground, Red is 5V Power, and Orange (or Yellow) is PWM Control.`,
            fromPoint: 'Servo 3-Pin Female Lead',
            toPoint: 'Connector Identification',
            wireType: '3-Pin Female Header',
            details: 'Never reverse the Red and Brown wires, which can damage the servo control IC.',
            completed: false
          },
          {
            id: `${id}-step-2`,
            stepNumber: 2,
            instruction: `Connect Ground: attach a Male-to-Male jumper from the Brown lead to Arduino GND.`,
            fromPoint: 'Servo Brown Wire (GND)',
            toPoint: 'Arduino GND',
            wireType: 'Male-to-Male Jumper',
            details: 'Common ground for control signal pulses.',
            completed: false
          },
          {
            id: `${id}-step-3`,
            stepNumber: 3,
            instruction: `Connect 5V Power: attach a Male-to-Male jumper from the Red lead to Arduino 5V.`,
            fromPoint: 'Servo Red Wire (5V)',
            toPoint: 'Arduino 5V',
            wireType: 'Male-to-Male Jumper',
            details: 'For high torque loads, power via dedicated external 5V-6V supply sharing common GND.',
            completed: false
          },
          {
            id: `${id}-step-4`,
            stepNumber: 4,
            instruction: `Connect PWM Signal: attach a Male-to-Male jumper from the Orange lead to Arduino PWM pin ${servoPin}.`,
            fromPoint: 'Servo Orange Wire (PWM)',
            toPoint: `Arduino PWM Pin ${servoPin}`,
            wireType: 'Male-to-Male Jumper',
            details: `Sends 50Hz PWM position pulses (1ms to 2ms pulse width for 0° to 180° rotation).`,
            completed: false
          }
        ]
      });
    } else if (id === 'dht11') {
      const dhtPin = pinMap['DATA'] || 'D4';
      guides.push({
        componentId: id,
        componentName: compName,
        location: mode,
        locationDetails: mode === 'breadboard' ? 'Breadboard Row A, Cols 28-30' : 'Direct Sensor Harness',
        overview: `DHT11 digital humidity and temperature module. Pin 1 (VCC) to 5V, Pin 2 (DATA) to pin ${dhtPin} with pull-up, Pin 4 (GND) to GND.`,
        steps: [
          {
            id: `${id}-step-1`,
            stepNumber: 1,
            instruction: `Insert DHT11 pins: Pin 1 (left) = VCC, Pin 2 = DATA, Pin 3 = NC (no connect), Pin 4 (right) = GND.`,
            fromPoint: 'DHT11 Pins',
            toPoint: 'Breadboard / Cable',
            wireType: 'Component Insertion',
            details: 'If using a 3-pin breakout board, pin labels VCC, DATA, and GND are printed on the PCB.',
            completed: false
          },
          {
            id: `${id}-step-2`,
            stepNumber: 2,
            instruction: `Install 10kΩ pull-up resistor: place a 10kΩ resistor across Pin 1 (VCC) and Pin 2 (DATA) if using a 4-pin bare sensor.`,
            fromPoint: 'Pin 1 (VCC)',
            toPoint: 'Pin 2 (DATA)',
            wireType: '10kΩ Pull-Up Resistor',
            details: 'Pull-up resistor maintains idle bus state during bi-directional serial transfer.',
            completed: false
          },
          {
            id: `${id}-step-3`,
            stepNumber: 3,
            instruction: `Connect VCC to Arduino 5V.`,
            fromPoint: 'DHT11 Pin 1 (VCC)',
            toPoint: 'Arduino 5V',
            wireType: 'Jumper Wire',
            details: 'Power input.',
            completed: false
          },
          {
            id: `${id}-step-4`,
            stepNumber: 4,
            instruction: `Connect DATA to Arduino digital pin ${dhtPin}.`,
            fromPoint: 'DHT11 Pin 2 (DATA)',
            toPoint: `Arduino Digital Pin ${dhtPin}`,
            wireType: 'Jumper Wire',
            details: 'Transmits 40-bit humidity and temperature packets.',
            completed: false
          },
          {
            id: `${id}-step-5`,
            stepNumber: 5,
            instruction: `Connect GND to Arduino GND.`,
            fromPoint: 'DHT11 Pin 4 (GND)',
            toPoint: 'Arduino GND',
            wireType: 'Jumper Wire',
            details: 'Ground connection.',
            completed: false
          }
        ]
      });
    } else if (id === 'relay') {
      const relayPin = pinMap['IN (Trigger)'] || 'D7';
      guides.push({
        componentId: id,
        componentName: compName,
        location: 'direct',
        locationDetails: 'Relay Breakout Header & Screw Terminals',
        overview: `5V electromechanical relay with optocoupler isolation. Signal IN connects to Arduino digital pin ${relayPin}. High-power loads wire in series across COM and NO terminals.`,
        steps: [
          {
            id: `${id}-step-1`,
            stepNumber: 1,
            instruction: `Connect VCC pin on the relay module to Arduino 5V.`,
            fromPoint: 'Relay VCC Header',
            toPoint: 'Arduino 5V',
            wireType: 'Female-to-Male Jumper',
            details: 'Powers the coil and optocoupler circuit.',
            completed: false
          },
          {
            id: `${id}-step-2`,
            stepNumber: 2,
            instruction: `Connect GND pin on the relay module to Arduino GND.`,
            fromPoint: 'Relay GND Header',
            toPoint: 'Arduino GND',
            wireType: 'Female-to-Male Jumper',
            details: 'Common ground return.',
            completed: false
          },
          {
            id: `${id}-step-3`,
            stepNumber: 3,
            instruction: `Connect IN (Signal) pin to Arduino digital pin ${relayPin}.`,
            fromPoint: 'Relay IN Header',
            toPoint: `Arduino Digital Pin ${relayPin}`,
            wireType: 'Female-to-Male Jumper',
            details: `Driving pin ${relayPin} HIGH energizes the magnetic coil and closes the contact.`,
            completed: false
          },
          {
            id: `${id}-step-4`,
            stepNumber: 4,
            instruction: `Wire output device in series: connect the external circuit live wire to COM (Common) and NO (Normally Open) screw terminals.`,
            fromPoint: 'External Circuit Live Lead',
            toPoint: 'Relay COM & NO Screw Terminals',
            wireType: 'Screw Terminal Series Wire',
            details: 'The relay acts as an isolated mechanical switch in series with the external load.',
            completed: false
          }
        ]
      });
    } else if (id === 'lcd-i2c') {
      guides.push({
        componentId: id,
        componentName: compName,
        location: 'direct',
        locationDetails: '4-Pin I2C Backpack on rear of LCD',
        overview: `16x2 character display communicating over I2C serial bus via A4 (SDA) and A5 (SCL).`,
        steps: [
          {
            id: `${id}-step-1`,
            stepNumber: 1,
            instruction: `Connect GND pin on the I2C backpack to Arduino GND.`,
            fromPoint: 'LCD I2C GND',
            toPoint: 'Arduino GND',
            wireType: 'Female-to-Male Jumper',
            details: 'Ground connection.',
            completed: false
          },
          {
            id: `${id}-step-2`,
            stepNumber: 2,
            instruction: `Connect VCC pin on the I2C backpack to Arduino 5V.`,
            fromPoint: 'LCD I2C VCC',
            toPoint: 'Arduino 5V',
            wireType: 'Female-to-Male Jumper',
            details: 'Powers the HD44780 controller and LED backlight.',
            completed: false
          },
          {
            id: `${id}-step-3`,
            stepNumber: 3,
            instruction: `Connect SDA (Serial Data) pin on the I2C backpack to Arduino pin A4 (or dedicated SDA header).`,
            fromPoint: 'LCD I2C SDA',
            toPoint: 'Arduino Pin A4 (SDA)',
            wireType: 'Female-to-Male Jumper',
            details: 'Carries bi-directional I2C serial data bytes.',
            completed: false
          },
          {
            id: `${id}-step-4`,
            stepNumber: 4,
            instruction: `Connect SCL (Serial Clock) pin on the I2C backpack to Arduino pin A5 (or dedicated SCL header).`,
            fromPoint: 'LCD I2C SCL',
            toPoint: 'Arduino Pin A5 (SCL)',
            wireType: 'Female-to-Male Jumper',
            details: 'Synchronizes clock pulses for I2C communication.',
            completed: false
          }
        ]
      });
    } else {
      // General comprehensive handler for any other component
      const steps: SequentialWiringStep[] = [];
      const pins = rule?.pins || [];

      if (pins.length > 0) {
        pins.forEach((pin, pIdx) => {
          const aPin = pinMap[pin.pinName] || pin.preferredArduinoPin;
          let wireType = mode === 'breadboard' ? 'Male-to-Male Jumper' : 'Female-to-Male Jumper';
          let details = `Connects ${pin.pinName} for ${pin.pinType} operation.`;

          if (pin.pinType === 'power_5v' || pin.pinType === 'power_3v3') {
            details = `Supplies ${pin.pinType === 'power_3v3' ? '3.3V' : '5V'} DC power.`;
          } else if (pin.pinType === 'gnd') {
            details = 'Circuit ground reference return.';
          } else if (pin.pinType === 'analog') {
            details = `Analog voltage sensing line read via Arduino ADC.`;
          } else {
            details = `Digital logic control line.`;
          }

          steps.push({
            id: `${id}-step-${pIdx + 1}`,
            stepNumber: pIdx + 1,
            instruction: mode === 'breadboard'
              ? `Connect ${pin.pinName}: run a jumper wire from ${pin.breadboardRow} Col ${pin.breadboardCol} to Arduino ${aPin}.`
              : `Connect ${pin.pinName}: attach a jumper wire directly from the component pin to Arduino ${aPin}.`,
            fromPoint: `${compName} ${pin.pinName}`,
            toPoint: `Arduino ${aPin}`,
            wireType,
            details,
            completed: false
          });
        });
      } else {
        steps.push({
          id: `${id}-step-1`,
          stepNumber: 1,
          instruction: `Connect ${compName} terminals sequentially according to circuit requirements.`,
          fromPoint: `${compName} Terminals`,
          toPoint: 'Arduino Headers',
          wireType: 'Jumper Wire',
          details: 'Physical pin routing.',
          completed: false
        });
      }

      guides.push({
        componentId: id,
        componentName: compName,
        location: mode,
        locationDetails: mode === 'breadboard' ? 'Breadboard tie-points' : 'Direct Arduino header connection',
        overview: `Sequential step-by-step physical connection guide for ${compName}.`,
        steps
      });
    }
  });

  return guides;
}

/**
 * Built-in STEAM Knowledge Base for Context Engine (Offline / Instant)
 */
export const CONTEXT_KNOWLEDGE_BASE: Record<string, { application: string; analogy: string; science: string }> = {
  'temperature': {
    application: 'Automated greenhouses and hospital incubators use precision digital temperature sensors to keep fragile seedlings and newborn babies in an exact thermal comfort zone.',
    analogy: 'A temperature sensor is like the tongue of a robot: instead of tasting food, it tastes how fast air and liquid molecules are bouncing around!',
    science: 'At absolute zero (-273.15°C), all atomic motion completely stops. Digital sensors like the DS18B20 measure tiny shifts in semiconductor bandgap voltage caused by molecular vibrations.'
  },
  'ds18b20': {
    application: 'Commercial brewing, water-pipe freeze monitoring, and marine biology research probes rely on waterproof DS18B20 sensors to measure liquid temperatures without short-circuiting.',
    analogy: 'Imagine sending thousands of letters down a single telegraph wire without them colliding — that is how the 1-Wire protocol lets one wire talk to dozens of sensors at once!',
    science: 'The DS18B20 contains an onboard 12-bit analog-to-digital converter (ADC) and a unique 64-bit laser-etched serial code, meaning no two sensors on Earth share the same address.'
  },
  'ultrasonic': {
    application: 'Self-parking cars, robotic vacuum cleaners, and industrial collision-avoidance drones use ultrasonic transducers to bounce inaudible sound pulses off obstacles.',
    analogy: 'It works just like a bat flying in a dark cave: it shouts a high-pitched beep and listens for how long the echo takes to bounce back!',
    science: 'Sound travels through air at approximately 343 meters per second. By measuring microseconds between trigger and echo, we compute distance down to millimeters using simple division!'
  },
  'servo-motor': {
    application: 'Airplane wing flaps, robotic surgery arms, and camera gimbals use servos to rotate to exact angles rather than spinning endlessly.',
    analogy: 'A DC motor is like a bicycle wheel spinning continuously, while a servo motor is like your human elbow — it moves smoothly to an exact position and locks there!',
    science: 'Servos use Pulse Width Modulation (PWM). A pulse of 1.5 milliseconds signals the internal potentiometer to hold center at 90 degrees.'
  },
  'led': {
    application: 'Fiber-optic internet transmitters, smartphone screens, and dashboard alert systems use LEDs to emit photons with almost zero wasted heat.',
    analogy: 'An incandescent bulb is like burning a campfire to get light, while an LED is like a solar panel operating backwards — electrical electrons jump a micro-cliff and release pure light!',
    science: 'LEDs rely on quantum mechanics: electrons recombining with electron holes in a direct-bandgap semiconductor release energy as single photons.'
  },
  'buzzer': {
    application: 'Microwave completion beepers, vehicle reverse alarms, and medical monitors rely on piezoelectric buzzers for high-efficiency auditory signals.',
    analogy: 'A buzzer is like an ultra-tiny metallic drumhead that a microchip strikes thousands of times every second.',
    science: 'Piezoelectric ceramic crystals expand and contract physically when an electric voltage is applied across them, creating physical sound waves in air.'
  },
  'resistor': {
    application: 'Every circuit board on Earth uses resistors to restrict current flow, prevent electronic components from burning up, and divide voltages.',
    analogy: 'Think of electricity like water rushing through a fire hose: a resistor is like a pinch or valve that slows the water down to a safe trickle!',
    science: 'Ohm’s Law (Voltage = Current × Resistance) governs the universe of electronics. Resistors convert unwanted electrical energy into microscopic amounts of thermal heat.'
  },
  'default': {
    application: 'Modern robotics and automation rely on microcontrollers to bridge sensors (the eyes and ears) with actuators (the muscles) to solve complex human challenges.',
    analogy: 'The Arduino is the brain of your robot, the breadboard is the nervous system, sensors are the sensory organs, and motors are the muscles.',
    science: 'Microcontrollers execute instructions at speeds measured in millions of cycles per second (16 MHz for Arduino Uno), cycling through input and output states in nanoseconds.'
  }
};

/**
 * Self-Processing Context Generator
 */
export function generateContextLocal(topic: string, currentProject?: SavedProject | null): {
  application: string;
  analogy: string;
  science: string;
} {
  const query = (topic || currentProject?.intent || '').toLowerCase();

  // Search keyword matching
  if (query.includes('temp') || query.includes('ds18b20') || query.includes('heat') || query.includes('water')) {
    return CONTEXT_KNOWLEDGE_BASE['ds18b20'];
  }
  if (query.includes('distance') || query.includes('sonar') || query.includes('ultra') || query.includes('proximity')) {
    return CONTEXT_KNOWLEDGE_BASE['ultrasonic'];
  }
  if (query.includes('servo') || query.includes('motor') || query.includes('arm') || query.includes('angle')) {
    return CONTEXT_KNOWLEDGE_BASE['servo-motor'];
  }
  if (query.includes('led') || query.includes('light') || query.includes('blink') || query.includes('lamp')) {
    return CONTEXT_KNOWLEDGE_BASE['led'];
  }
  if (query.includes('buzzer') || query.includes('alarm') || query.includes('sound') || query.includes('beep')) {
    return CONTEXT_KNOWLEDGE_BASE['buzzer'];
  }
  if (query.includes('resistor') || query.includes('ohm') || query.includes('pull-up')) {
    return CONTEXT_KNOWLEDGE_BASE['resistor'];
  }

  // Check current project components
  if (currentProject?.selectedComponentIds) {
    for (const compId of currentProject.selectedComponentIds) {
      if (CONTEXT_KNOWLEDGE_BASE[compId]) {
        return CONTEXT_KNOWLEDGE_BASE[compId];
      }
    }
  }

  return CONTEXT_KNOWLEDGE_BASE['default'];
}

/**
 * Self-Processing STEAM Activity Generator
 */
export function generateActivitiesLocal(currentProject?: SavedProject | null): string {
  const compIds = currentProject?.selectedComponentIds || [];
  const intent = currentProject?.intent || 'Arduino Workbench Experiment';

  const hasTemp = compIds.includes('ds18b20') || compIds.includes('dht11');
  const hasUltrasonic = compIds.includes('ultrasonic');
  const hasLED = compIds.includes('led');
  const hasBuzzer = compIds.includes('buzzer');
  const hasServo = compIds.includes('servo-motor');

  let tinkererChallenge = 'Modify the delay time in the loop from 500ms to 100ms. Observe the change in serial response rate on the Serial Monitor.';
  let engineerChallenge = 'Add a secondary safety threshold condition in code and test with Serial Monitor debugging.';
  let inventorChallenge = 'Build a physical cardboard housing or enclosure to protect your circuit from ambient interference.';

  if (hasTemp) {
    tinkererChallenge = 'Touch the temperature probe with your warm fingers and observe how quickly the readings climb on the Serial Monitor. Calculate the rise time in seconds.';
    engineerChallenge = 'Add a hysteresis window of 2°C in your code to prevent alert oscillation when the temperature hovers right near the threshold.';
    inventorChallenge = 'Design a smart fish aquarium monitor or medicine cooling box that alerts caretakers if water or storage temperature departs from safe limits.';
  } else if (hasUltrasonic) {
    tinkererChallenge = 'Hold a flat notebook at 10cm, 20cm, and 30cm in front of the HC-SR04 sensor. Measure with a physical ruler and calculate the sensor accuracy error.';
    engineerChallenge = 'Program a variable pulse alarm: make the LED or buzzer frequency beep faster as an approaching obstacle gets closer.';
    inventorChallenge = 'Design an automatic pedestrian crosswalk or smart reverse parking aid for a model robotic vehicle.';
  } else if (hasServo) {
    tinkererChallenge = 'Change the sweep angles from 0°-90° to a full 0°-180° sweep with a smooth stepped loop in C++.';
    engineerChallenge = 'Calibrate the servo to mimic an analog meter gauge with a paper dial showing low, medium, and high readings.';
    inventorChallenge = 'Engineer an automated dispensing lid or robotic pet feeder that triggers when conditions are met.';
  }

  return `### 🚀 STEAM Level-Up Guide: ${intent}

#### 🛠️ 1. Tinkerer Tier (10 Minutes)
* **Goal**: Hands-on inspection and rapid experimentation.
* **Challenge**: ${tinkererChallenge}
* **Check for Understanding**: What changed in the circuit telemetry or physical behavior when you adjusted the parameters?

---

#### 📐 2. Engineer Tier (20 Minutes)
* **Goal**: Structural refinement and algorithmic enhancement.
* **Challenge**: ${engineerChallenge}
* **Bonus Modification**: ${hasLED && hasBuzzer ? 'Synchronize the LED flash with buzzer audio chirp patterns.' : 'Incorporate an extra visual or auditory feedback loop into your breadboard.'}

---

#### 💡 3. Inventor Tier (Open-Ended)
* **Goal**: Real-world problem solving with creative engineering.
* **Challenge**: ${inventorChallenge}
* **STEAM Career Link**: Industrial control engineers and biomedical technicians design similar closed-loop monitoring apparatuses every day!
`;
}
