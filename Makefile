word_lists = "http://hskhsk.pythonanywhere.com/words1000"

tmp:
	mkdir -p tmp

raw:
	mkdir -p raw

# NOTE: This is sort of just for reference since it seems that it would take
# more work to automate the unzipping of this. Need some new CLI
raw/8000zhuyin.zip: raw
	wget -O $@ https://www.sc-top.org.tw/download/8000zhuyin.zip
