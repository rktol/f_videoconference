# coding: UTF-8

# elan_dataからtestcsv\talkに成形して転送するプログラム
import csv
import glob

groups = ["1", "2"]
condition = ["0","1", "2"]

for g_index,group in enumerate(groups):
    for c_index,c in enumerate(condition):
        path ='./elan_data/{0}_{1}.csv'.format(group,c)
        # print('group{0},condition{1}'.format(group,c))
        filelist = glob.glob(path)
        print(filelist)
        for file in filelist:
            data = []
            with open(file,encoding="utf-8-sig") as f:
                reader = csv.reader(f)
                for index,row in enumerate(reader):
                    tmp = []
                    for i_index,i in enumerate(row):
                        if(i_index != 1):
                            tmp.append(i)
                    data.append(tmp)

            with open('./testcsv/talk/{0}_{1}.csv'.format(group,c), 'w', newline="",encoding="utf-8") as g:
                writer = csv.writer(g, lineterminator='\n')
                for row in data:
                    writer.writerow(row)
