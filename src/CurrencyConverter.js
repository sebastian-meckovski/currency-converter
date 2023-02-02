import './CurrencyConverter.scss';
import './components/comboBox.scss';
import { useState, useEffect, useRef } from 'react';
import { ComboBox as ComboBoxComponent } from './components/ComboBox';
import { faExchangeAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import exclusionList from './data/exclusionList';
import listItemRender from './itemRender';

function CurrencyConverter() {
	const [baseCurrencyInputValue, setBaseCurrencyInputValue] = useState(null);
	const [counterCurrencyInputValue, setCounterCurrencyInputValue] = useState(null);
	const [filteredCurrencies, setFilteredCurrencies] = useState(null);
	const [baseCurrency, setBaseCurrency] = useState(null);
	const [counterCurrency, setCounterCurrency] = useState(null);
	const [rates, setRates] = useState(null);
	const [conversionRate, setConversionRate] = useState(null);
	const [baseCurrencyValue, setBaseCurrencyValue] = useState(100);
	const [conversionString, setConversionString] = useState('');
	const [display, setDisplay] = useState(false);
	const [error, setError] = useState(null);
	const [time, setTime] = useState(null);
	const [loading, setLoading] = useState({ loadingDropdown: true, loadingCoversion: false });
	const currencies = useRef(null);

	const fetchConversion = async () => {
		setError(null);
		try {
			setLoading((prev) => {
				return { ...prev, loadingCoversion: true };
			});
			const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency.currency}`);
			const data = await response.json();
			setRates(data.rates);
		} catch (e) {
			setError(e);
		} finally {
			setLoading((prev) => {
				return { ...prev, loadingCoversion: false };
			});
		}
	};

	const handleSwap = () => {
		setDisplay(false);
		setRates(null);
		setBaseCurrency(counterCurrency);
		setCounterCurrency(baseCurrency);
	};

	const fetchCurrencies = async () => {
		try {
			const response = await fetch('https://openexchangerates.org/api/currencies.json');
			const data = await response.json();
			let result = [];
			for (let currency in data) {
				if (!exclusionList.includes(currency)) {
					result.push({ currency, name: data[currency], searchName: `${currency} ${data[currency]}` });
				}
			}
			currencies.current = result;
			setFilteredCurrencies(result);
			setBaseCurrency(result.find((x) => x.currency === 'GBP') !== undefined ? result.find((x) => x.currency === 'GBP') : result[0]);
			setCounterCurrency(result.find((x) => x.currency === 'EUR') !== undefined ? result.find((x) => x.currency === 'EUR') : result[1]);
		} catch (e) {
			setError(e);
		} finally {
			setLoading((prev) => {
				return { ...prev, loadingDropdown: false };
			});
		}
	};

	useEffect(() => {
		const intervalId = setInterval(() => {
			setTime((prevTime) => prevTime - 1);
		}, 1000);

		if (time === 0) {
			setDisplay(false);
			setConversionString(null);
		}
		return () => clearInterval(intervalId);
	}, [time]);

	useEffect(() => {
		fetchCurrencies();
	}, []);

	useEffect(() => {
		if (rates && counterCurrency) {
			setConversionRate(rates[counterCurrency.currency]);
			setDisplay(true);
			setTime(600);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rates]);

	useEffect(() => {
		if (baseCurrency && conversionRate && counterCurrency && baseCurrencyValue && display) {
			setConversionString(
				`${baseCurrencyValue}  ${baseCurrency.currency} is equivalent to ${(conversionRate * baseCurrencyValue).toFixed(0)} ${
					counterCurrency.currency
				}`
			);
		} else {
			setConversionString(null);
		}
	}, [baseCurrency, conversionRate, counterCurrency, baseCurrencyValue, display]);

	useEffect(() => {
		baseCurrency && setBaseCurrencyInputValue(baseCurrency.searchName);
		counterCurrency && setCounterCurrencyInputValue(counterCurrency.searchName);
	}, [baseCurrency, counterCurrency]);

	return (
		<div className="App">
			<div className="inputWrapper">
				<p>Amount</p>
				<div className="Amount">
					<input
						className="input"
						type="number"
						value={baseCurrencyValue}
						onChange={(e) => {
							setDisplay(false);
							setConversionRate(null);
							setBaseCurrencyValue(e.target.value);
						}}
					/>
					<button className="swapButton" onClick={handleSwap}>
						<FontAwesomeIcon icon={faExchangeAlt} />{' '}
					</button>
				</div>
			</div>
			<ComboBoxComponent
				dataSource={filteredCurrencies}
				listItemRender={listItemRender}
				onItemClick={(e, item) => {
					item && setBaseCurrency(item);
					item && setBaseCurrencyInputValue(item.searchName);
					setDisplay(false);
					setConversionString(null);
				}}
				onInputChange={(e) => {
					setBaseCurrencyInputValue(e.target.value);
					const newData = currencies.current.filter((x) => x.searchName.toLowerCase().includes(e.target.value.toLowerCase()));
					setFilteredCurrencies(newData);
				}}
				inputValue={baseCurrencyInputValue}
				onDropdownClosed={() => {
					baseCurrency && setBaseCurrencyInputValue(baseCurrency.searchName);
					setFilteredCurrencies(currencies.current);
				}}
				selectedValue={baseCurrency}
				isLoading={loading.loadingDropdown}
				EmptyResultMessage={'No Currencies Found'}
				placeholder={'Enter currency...'}
			/>
			<ComboBoxComponent
				dataSource={filteredCurrencies}
				listItemRender={listItemRender}
				onItemClick={(x, item) => {
					item && setCounterCurrency(item);
					item && setCounterCurrencyInputValue(item.searchName);
					setDisplay(false);
					setConversionString(null);
				}}
				onInputChange={(e) => {
					setCounterCurrencyInputValue(e.target.value);
					const newData = currencies.current.filter((x) => x.searchName.toLowerCase().includes(e.target.value.toLowerCase()));
					setFilteredCurrencies(newData);
				}}
				inputValue={counterCurrencyInputValue}
				onDropdownClosed={() => {
					counterCurrency && setCounterCurrencyInputValue(counterCurrency.searchName);
					setFilteredCurrencies(currencies.current);
				}}
				selectedValue={counterCurrency}
				isLoading={loading.loadingDropdown}
				EmptyResultMessage={'No Currencies Found'}
				placeholder={'Enter currency...'}
			/>
			<div className="conversionMessage">{conversionString && display && <p>{conversionString}</p>}</div>
			{loading.loadingCoversion && <FontAwesomeIcon icon={faSpinner} className="spinner" />}
			{display && conversionString && (
				<div className="timer">
					<p>Expires in:</p>
					<p>{Math.floor(time / 60)}'</p>
					<p>{(time % 60).toString().padStart(2, '0')}''</p>
				</div>
			)}
			<button className="convertButton" onClick={fetchConversion}>
				Convert
			</button>
			{error && <p>something went wrong...</p>}
		</div>
	);
}

export default CurrencyConverter;
