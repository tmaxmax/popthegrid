package share

import "encoding/json"

type enum interface {
	~string
	Validate() error
}

func unmarshalEnum[E enum](data []byte, e *E) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	en := E(s)
	if err := en.Validate(); err != nil {
		return err
	}

	*e = en

	return nil
}
