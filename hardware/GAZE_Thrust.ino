#include <Adafruit_TinyUSB.h>

// We moved the wire to Physical Pin 002
// In the software, Pin 002 is definitely "A0"
const int hallPin = A0;

void setup()
{
	Serial.begin(9600);
	pinMode(hallPin, INPUT);
}

void loop()
{
	int rawValue = analogRead(hallPin);

	// Debug print
	Serial.print("Pin A0 (002) Raw: ");
	Serial.println(rawValue);

	delay(100);
}